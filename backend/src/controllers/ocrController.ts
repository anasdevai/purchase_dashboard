import type { Request, Response } from "express";
import { extractRepairOrderFromFile } from "../services/geminiOcrService.js";
import { detectOcrFileCategory, isSupportedOcrCategory } from "../utils/ocrFile.utils.js";
import { HttpError } from "../utils/httpError.js";

export const extractRepairOrder = async (req: Request, res: Response) => {
  if (!req.file) {
    throw new HttpError(400, "No file uploaded. Use form field name: file");
  }

  const { category, mimeType } = detectOcrFileCategory(req.file.mimetype, req.file.originalname);

  if (!isSupportedOcrCategory(category)) {
    throw new HttpError(
      400,
      "Unsupported file type. Allowed: JPG, JPEG, PNG, WEBP, PDF, DOC, DOCX",
    );
  }

  const result = await extractRepairOrderFromFile(req.file.buffer, category, mimeType);
  res.json(result);
};
