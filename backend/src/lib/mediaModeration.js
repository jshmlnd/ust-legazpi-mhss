import { execFile } from "node:child_process";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { fileTypeFromFile } from "file-type";

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;
export const MAX_VIDEO_SIZE = 250 * 1024 * 1024;
export const MAX_VIDEO_DURATION_SECONDS = 5 * 60;
export const DEFAULT_NSFW_THRESHOLD = 0.55;
export const VIDEO_FRAME_INTERVAL_SECONDS = 1;
export const MAX_VIDEO_FRAMES = Math.ceil(MAX_VIDEO_DURATION_SECONDS / VIDEO_FRAME_INTERVAL_SECONDS);
export const MAX_ANIMATED_FRAMES = 300;

const BLOCKED_LABELS = new Set(["Porn", "Hentai"]);
const execFileAsync = promisify(execFile);
const MAX_SCAN_QUEUE = 4;
const CLASSIFIER_TIMEOUT_MS = Math.min(
  60 * 1000,
  Math.max(5 * 1000, Number(process.env.MEDIA_CLASSIFIER_TIMEOUT_MS) || 30 * 1000),
);
const FFMPEG_TIMEOUT_MS = Math.min(
  10 * 60 * 1000,
  Math.max(30 * 1000, Number(process.env.MEDIA_FFMPEG_TIMEOUT_MS) || 10 * 60 * 1000),
);

let modelPromise;
let activeScans = 0;
const scanWaiters = [];

export class MediaRejectedError extends Error {
  constructor(message = "Media could not be uploaded") {
    super(message);
    this.name = "MediaRejectedError";
    this.statusCode = 400;
  }
}

export class MediaModerationUnavailableError extends Error {
  constructor(message = "Media moderation is temporarily unavailable") {
    super(message);
    this.name = "MediaModerationUnavailableError";
    this.statusCode = 503;
  }
}

export const SUPPORTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);
export const SUPPORTED_DOCUMENT_TYPES = new Set([
  "application/pdf",
  "application/zip",
  "application/x-rar-compressed",
  "application/vnd.rar",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

export const isSupportedMediaType = (mimeType) => (
  SUPPORTED_IMAGE_TYPES.has(mimeType) || mimeType?.startsWith("video/")
);

export const isSupportedDocumentType = (mimeType) => SUPPORTED_DOCUMENT_TYPES.has(mimeType);

export const getMediaValidationError = ({ mimeType, size, durationSeconds }) => {
  if (!mimeType?.startsWith("image/") && !mimeType?.startsWith("video/")) {
    return "Images and videos only";
  }

  const limit = mimeType.startsWith("video/") ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
  if (!Number.isFinite(size) || size <= 0 || size > limit) {
    return mimeType.startsWith("video/")
      ? "Video exceeds the 250 MB limit"
      : "Image exceeds the 10 MB limit";
  }

  if (mimeType.startsWith("video/") && Number.isFinite(durationSeconds) && durationSeconds > MAX_VIDEO_DURATION_SECONDS) {
    return "Video exceeds the 5 minutes limit";
  }

  return null;
};

export const shouldBlockPredictions = (predictions, threshold = DEFAULT_NSFW_THRESHOLD) => (
  predictions.some(({ className, probability }) => (
    BLOCKED_LABELS.has(className) && probability >= threshold
  ))
);

const acquireScanSlot = async () => {
  const maxConcurrent = Math.min(2, Math.max(1, Number(process.env.MEDIA_MAX_CONCURRENT_SCANS) || 1));
  if (activeScans >= maxConcurrent) {
    if (scanWaiters.length >= MAX_SCAN_QUEUE) throw new MediaModerationUnavailableError();
    await new Promise((resolve) => scanWaiters.push(resolve));
  }
  activeScans += 1;
};

const releaseScanSlot = () => {
  activeScans -= 1;
  scanWaiters.shift()?.();
};

const getModel = async () => {
  if (!modelPromise) {
    modelPromise = (async () => {
      const tf = await import("@tensorflow/tfjs");
      const nsfwjs = await import("nsfwjs");
      await tf.setBackend("cpu");
      await tf.ready();
      return { tf, model: await nsfwjs.load("MobileNetV2") };
    })().catch((error) => {
      modelPromise = null;
      throw error;
    });
  }
  return modelPromise;
};

const withTimeout = (promise, timeoutMs) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new MediaModerationUnavailableError()), timeoutMs);
  promise.then((value) => {
    clearTimeout(timer);
    resolve(value);
  }, (error) => {
    clearTimeout(timer);
    reject(error);
  });
});

const classifyImageBuffer = async (buffer, page = 0) => {
  const sharp = (await import("sharp")).default;
  const { tf, model } = await getModel();
  const { data, info } = await sharp(buffer, { animated: true, page, pages: 1 })
    .rotate()
    .resize(224, 224, { fit: "inside", withoutEnlargement: false })
    .toColourspace("srgb")
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const tensor = tf.tensor3d(new Uint8Array(data), [info.height, info.width, info.channels], "int32");
  try {
    return await withTimeout(model.classify(tensor), CLASSIFIER_TIMEOUT_MS);
  } finally {
    tensor.dispose();
  }
};

export const scanImageFile = async (filePath) => {
  await acquireScanSlot();
  try {
    const buffer = await readFile(filePath);
    const sharp = (await import("sharp")).default;
    const { pages = 1 } = await sharp(buffer, { animated: true }).metadata();
    if (pages > MAX_ANIMATED_FRAMES) throw new MediaRejectedError();
    let firstPredictions;
    for (let page = 0; page < pages; page += 1) {
      const predictions = await classifyImageBuffer(buffer, page);
      if (shouldBlockPredictions(predictions)) throw new MediaRejectedError();
      if (page === 0) firstPredictions = predictions;
    }
    return { predictions: firstPredictions, frameCount: pages };
  } finally {
    releaseScanSlot();
  }
};

const getVideoDuration = async (filePath) => {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1",
    filePath,
  ], { timeout: 30 * 1000, maxBuffer: 1024 * 1024 });
  const duration = Number.parseFloat(stdout.trim());
  if (!Number.isFinite(duration)) throw new MediaRejectedError();
  return duration;
};

export const detectMediaFileType = (filePath) => fileTypeFromFile(filePath);

export const scanVideoFile = async (filePath, size) => {
  const durationSeconds = await getVideoDuration(filePath);
  const validationError = getMediaValidationError({
    mimeType: "video/*",
    size,
    durationSeconds,
  });
  if (validationError) throw new MediaRejectedError(validationError);

  await acquireScanSlot();
  let frameDirectory;
  try {
    frameDirectory = await mkdtemp(path.join(os.tmpdir(), "safe-space-frames-"));
    await execFileAsync("ffmpeg", [
      "-hide_banner", "-loglevel", "error",
      "-i", filePath,
      "-vf", `fps=1/${VIDEO_FRAME_INTERVAL_SECONDS},scale=224:224:force_original_aspect_ratio=decrease`,
      "-frames:v", String(MAX_VIDEO_FRAMES),
      path.join(frameDirectory, "%06d.jpg"),
    ], { timeout: FFMPEG_TIMEOUT_MS, maxBuffer: 1024 * 1024 });

    const frames = (await readdir(frameDirectory)).filter((name) => name.endsWith(".jpg")).sort();
    if (frames.length === 0) throw new MediaRejectedError();
    for (const frame of frames) {
      const predictions = await classifyImageBuffer(await readFile(path.join(frameDirectory, frame)));
      if (shouldBlockPredictions(predictions)) throw new MediaRejectedError();
    }
    return { durationSeconds, frameCount: frames.length };
  } finally {
    if (frameDirectory) await rm(frameDirectory, { recursive: true, force: true });
    releaseScanSlot();
  }
};

export const scanMediaFile = async ({ path: filePath, size }) => {
  const detected = await detectMediaFileType(filePath);
  if (!detected || !isSupportedMediaType(detected.mime)) throw new MediaRejectedError();

  const validationError = getMediaValidationError({ mimeType: detected.mime, size });
  if (validationError) throw new MediaRejectedError(validationError);

  if (detected.mime.startsWith("image/")) {
    await scanImageFile(filePath);
    return { mimeType: detected.mime, resourceType: "image" };
  }

  await scanVideoFile(filePath, size);
  return { mimeType: detected.mime, resourceType: "video" };
};
