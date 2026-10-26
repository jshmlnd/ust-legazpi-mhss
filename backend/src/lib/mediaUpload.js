import { createWriteStream } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import Busboy from "busboy";
import { MAX_DOCUMENT_SIZE, MAX_VIDEO_SIZE, MediaRejectedError } from "./mediaModeration.js";

const safeFilename = (filename) => {
  const basename = path.basename(filename || "upload");
  return basename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100) || "upload";
};

export const parseMultipartRequest = async (request, {
  maxFiles = 4,
  maxFileSize = MAX_VIDEO_SIZE,
  maxNonVideoSize = MAX_DOCUMENT_SIZE,
  maxTotalSize = maxFileSize * maxFiles,
} = {}) => {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "safe-space-upload-"));
  const fields = {};
  const files = [];
  const fileTasks = [];
  let totalSize = 0;
  let totalLimited = false;
  let cleaned = false;

  const cleanup = async () => {
    if (cleaned) return;
    cleaned = true;
    await rm(tempDirectory, { recursive: true, force: true });
  };

  return new Promise((resolve, reject) => {
    let settled = false;
    const fail = async (error) => {
      if (settled) return;
      settled = true;
      request.resume();
      await Promise.allSettled(fileTasks);
      await cleanup();
      reject(error);
    };
    const abort = () => fail(new MediaRejectedError("Upload aborted"));

    let busboy;
    try {
      busboy = Busboy({
        headers: request.headers,
        limits: {
          files: maxFiles,
          fileSize: maxFileSize,
          fields: 50,
          parts: maxFiles + 50,
        },
      });
    } catch (error) {
      fail(error);
      return;
    }

    busboy.on("field", (name, value) => {
      fields[name] = value;
    });

    busboy.on("file", (fieldname, file, info) => {
      const fileIndex = fileTasks.length;
      const record = {
        fieldname,
        filename: info.filename || "upload",
        mimeType: info.mimeType,
        path: path.join(tempDirectory, `${fileIndex}-${safeFilename(info.filename)}`),
        size: 0,
      };
      let wasLimited = false;
      let prefix = Buffer.alloc(0);
      let streamLimit = info.mimeType?.startsWith("video/") ? maxFileSize : maxNonVideoSize;
      file.on("data", (chunk) => {
        record.size += chunk.length;
        totalSize += chunk.length;
        if (prefix.length < 16) prefix = Buffer.concat([prefix, chunk]).subarray(0, 16);
        const isVideo = prefix.length >= 8 && (
          prefix.subarray(4, 8).toString() === "ftyp"
          || prefix.subarray(0, 4).toString("hex") === "1a45dfa3"
          || (prefix.subarray(0, 4).toString() === "RIFF" && prefix.subarray(8, 12).toString() === "AVI ")
          || prefix.subarray(0, 4).toString() === "OggS"
        );
        streamLimit = isVideo ? maxFileSize : maxNonVideoSize;
        if ((record.size > streamLimit || totalSize > maxTotalSize) && !totalLimited) {
          totalLimited = true;
          file.destroy(new MediaRejectedError("File exceeds the upload limit"));
        }
      });
      file.on("limit", () => { wasLimited = true; });

      const task = pipeline(file, createWriteStream(record.path)).then(() => {
        if (wasLimited || totalLimited) throw new MediaRejectedError("File exceeds the upload limit");
        files[fileIndex] = record;
      });
      fileTasks.push(task);
      task.catch((error) => fail(error));
    });

    busboy.on("filesLimit", () => fail(new MediaRejectedError("Too many files")));
    busboy.on("partsLimit", () => fail(new MediaRejectedError("Too many form fields")));
    busboy.on("error", fail);
    request.once("aborted", abort);
    request.once("error", fail);
    busboy.on("close", async () => {
      try {
        await Promise.all(fileTasks);
        if (!settled) {
          settled = true;
          request.off("aborted", abort);
          request.off("error", fail);
          resolve({ fields, files: files.filter(Boolean), cleanup });
        }
      } catch (error) {
        await fail(error);
      }
    });

    request.pipe(busboy);
  });
};
