import multer from "multer";
import { env } from "../config/env.js";
import { allowedUploadMimeTypes } from "../validators/fileValidators.js";
import { HttpError } from "../utils/httpError.js";

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_UPLOAD_SIZE_MB * 1024 * 1024
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedUploadMimeTypes.includes(file.mimetype as (typeof allowedUploadMimeTypes)[number])) {
      callback(new HttpError(400, "Only PNG and SVG uploads are allowed. Signatures must be PNG."));
      return;
    }

    callback(null, true);
  }
});
