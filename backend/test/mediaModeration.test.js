import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_NSFW_THRESHOLD,
  getMediaValidationError,
  isSupportedDocumentType,
  isSupportedMediaType,
  shouldBlockPredictions,
} from "../src/lib/mediaModeration.js";

test("allows supported images within the upload limit", () => {
  assert.equal(getMediaValidationError({
    mimeType: "image/jpeg",
    size: 5 * 1024 * 1024,
  }), null);
});

test("rejects videos over 250 MB", () => {
  assert.match(getMediaValidationError({
    mimeType: "video/mp4",
    size: 250 * 1024 * 1024 + 1,
  }), /250 MB/);
});

test("rejects videos longer than five minutes", () => {
  assert.match(getMediaValidationError({
    mimeType: "video/mp4",
    size: 1024,
    durationSeconds: 301,
  }), /5 minutes/);
});

test("rejects unsupported media types", () => {
  assert.match(getMediaValidationError({
    mimeType: "application/pdf",
    size: 1024,
  }), /Images and videos/);
});

test("blocks porn and hentai predictions at the configured threshold", () => {
  assert.equal(shouldBlockPredictions([
    { className: "Porn", probability: DEFAULT_NSFW_THRESHOLD },
  ]), true);
  assert.equal(shouldBlockPredictions([
    { className: "Hentai", probability: DEFAULT_NSFW_THRESHOLD + 0.1 },
  ]), true);
});

test("does not block neutral or merely suggestive predictions", () => {
  assert.equal(shouldBlockPredictions([
    { className: "Neutral", probability: 0.99 },
    { className: "Sexy", probability: 0.99 },
  ]), false);
});

test("accepts raster images and videos but not SVG uploads", () => {
  assert.equal(isSupportedMediaType("image/jpeg"), true);
  assert.equal(isSupportedMediaType("video/mp4"), true);
  assert.equal(isSupportedMediaType("image/svg+xml"), false);
});

test("allowlists the document formats exposed by chat", () => {
  assert.equal(isSupportedDocumentType("application/pdf"), true);
  assert.equal(isSupportedDocumentType("application/octet-stream"), false);
});
