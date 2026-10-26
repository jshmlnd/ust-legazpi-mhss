import { parseMultipartRequest } from "../lib/mediaUpload.js";

export const mediaMultipart = (options) => async (req, res, next) => {
  if (!req.is("multipart/form-data")) return next();

  try {
    const upload = await parseMultipartRequest(req, options);
    req.body = { ...(req.body || {}), ...upload.fields };
    req.mediaFiles = upload.files;
    req.cleanupMediaFiles = upload.cleanup;
    res.once("finish", upload.cleanup);
    next();
  } catch (error) {
    res.status(error.statusCode || 400).json({ error: error.message || "Media upload failed" });
  }
};
