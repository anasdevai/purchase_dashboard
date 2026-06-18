import path from "node:path";

const IMAGE_MIMES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const PDF_MIMES = new Set(["application/pdf"]);
const PDF_EXTENSIONS = new Set([".pdf"]);
const DOCX_MIMES = new Set([
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const DOCX_EXTENSIONS = new Set([".docx"]);
const DOC_MIMES = new Set(["application/msword"]);
const DOC_EXTENSIONS = new Set([".doc"]);

export const OCR_ALLOWED_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".pdf",
  ".doc",
  ".docx",
] as const;

export type OcrFileCategory = "image" | "pdf" | "docx" | "doc" | "unsupported";

export function getExtension(filename: string) {
  return path.extname(filename || "").toLowerCase();
}

function normalizeImageMime(mime: string, ext: string) {
  if (IMAGE_MIMES.has(mime)) return mime === "image/jpg" ? "image/jpeg" : mime;
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg";
}

export function isAllowedOcrUpload(mimetype: string, originalname: string) {
  const ext = getExtension(originalname);
  const mime = (mimetype || "").toLowerCase();

  if (IMAGE_MIMES.has(mime) || IMAGE_EXTENSIONS.has(ext)) return true;
  if (PDF_MIMES.has(mime) || PDF_EXTENSIONS.has(ext)) return true;
  if (DOCX_MIMES.has(mime) || DOCX_EXTENSIONS.has(ext)) return true;
  if (DOC_MIMES.has(mime) || DOC_EXTENSIONS.has(ext)) return true;

  if (!mime || mime === "application/octet-stream") {
    return OCR_ALLOWED_EXTENSIONS.some((allowed) => ext === allowed);
  }

  return false;
}

export function detectOcrFileCategory(mimetype: string, originalname: string) {
  const ext = getExtension(originalname);
  const mime = (mimetype || "").toLowerCase();

  if (IMAGE_MIMES.has(mime) || IMAGE_EXTENSIONS.has(ext)) {
    return { category: "image" as const, mimeType: normalizeImageMime(mime, ext) };
  }

  if (PDF_MIMES.has(mime) || PDF_EXTENSIONS.has(ext)) {
    return { category: "pdf" as const, mimeType: "application/pdf" };
  }

  if (DOCX_MIMES.has(mime) || DOCX_EXTENSIONS.has(ext)) {
    return { category: "docx" as const, mimeType: mime || "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };
  }

  if (DOC_MIMES.has(mime) || DOC_EXTENSIONS.has(ext)) {
    return { category: "doc" as const, mimeType: mime || "application/msword" };
  }

  return { category: "unsupported" as const, mimeType: mime };
}

export function isSupportedOcrCategory(category: OcrFileCategory) {
  return category === "image" || category === "pdf" || category === "docx" || category === "doc";
}
