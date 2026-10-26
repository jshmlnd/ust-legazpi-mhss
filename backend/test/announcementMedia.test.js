import test from "node:test";
import assert from "node:assert/strict";
import { parseRetainedImages } from "../src/controllers/announcement.controller.js";

const storedImage = "https://res.cloudinary.com/example/image/upload/v1/photo.jpg";

test("retains only Cloudinary images already attached to an announcement", () => {
  assert.deepEqual(parseRetainedImages(JSON.stringify([storedImage]), [storedImage]), [storedImage]);
  assert.throws(
    () => parseRetainedImages(JSON.stringify([`${storedImage}-other`]), [storedImage]),
    /Media could not be uploaded/,
  );
});

test("does not accept retained images when creating an announcement", () => {
  assert.throws(
    () => parseRetainedImages(JSON.stringify([storedImage])),
    /Media could not be uploaded/,
  );
});
