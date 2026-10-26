import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { Readable } from "node:stream";
import { parseMultipartRequest } from "../src/lib/mediaUpload.js";

const multipartRequest = (body, boundary = "test-boundary") => {
  const request = Readable.from(Buffer.from(body));
  request.headers = { "content-type": `multipart/form-data; boundary=${boundary}` };
  return request;
};

test("parses fields and stores multipart media in a temporary file", async () => {
  const request = multipartRequest([
    "--test-boundary",
    'Content-Disposition: form-data; name="caption"',
    "",
    "hello",
    "--test-boundary",
    'Content-Disposition: form-data; name="media"; filename="photo.jpg"',
    "Content-Type: image/jpeg",
    "",
    "jpeg-bytes",
    "--test-boundary--",
    "",
  ].join("\r\n"));

  const upload = await parseMultipartRequest(request);
  assert.equal(upload.fields.caption, "hello");
  assert.equal(upload.files.length, 1);
  assert.equal(upload.files[0].filename, "photo.jpg");
  assert.equal((await readFile(upload.files[0].path)).toString(), "jpeg-bytes");

  await upload.cleanup();
  await assert.rejects(access(upload.files[0].path));
});

test("keeps multiple uploaded files separate", async () => {
  const request = multipartRequest([
    "--test-boundary",
    'Content-Disposition: form-data; name="media"; filename="one.jpg"',
    "Content-Type: image/jpeg",
    "",
    "one",
    "--test-boundary",
    'Content-Disposition: form-data; name="media"; filename="two.jpg"',
    "Content-Type: image/jpeg",
    "",
    "two",
    "--test-boundary--",
    "",
  ].join("\r\n"));

  const upload = await parseMultipartRequest(request);
  assert.deepEqual(
    await Promise.all(upload.files.map(({ path }) => readFile(path, "utf8"))),
    ["one", "two"],
  );
  await upload.cleanup();
});

test("enforces the route-specific file limit while streaming", async () => {
  const request = multipartRequest([
    "--test-boundary",
    'Content-Disposition: form-data; name="media"; filename="too-large.jpg"',
    "Content-Type: image/jpeg",
    "",
    "12345",
    "--test-boundary--",
    "",
  ].join("\r\n"));

  await assert.rejects(
    parseMultipartRequest(request, { maxFileSize: 4, maxNonVideoSize: 4 }),
    /exceeds the upload limit/,
  );
});
