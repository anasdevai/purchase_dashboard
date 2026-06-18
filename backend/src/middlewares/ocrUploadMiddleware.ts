import multer from "multer";
import { env } from "../config/env.js";
import { isAllowedOcrUpload } from "../utils/ocrFile.utils.js";
import { HttpError } from "../utils/httpError.js";

export const ocrUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_UPLOAD_SIZE_MB * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (!isAllowedOcrUpload(file.mimetype, file.originalname)) {
      callback(
        new HttpError(
          400,
          "Unsupported file type. Allowed: JPG, JPEG, PNG, WEBP, PDF, DOC, DOCX",
        ),
      );
      return;
    }

    callback(null, true);
  },
});
