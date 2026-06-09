import { z } from "zod";

export const fileTypeSchema = z.enum([
  "id_front",
  "id_back",
  "device_front",
  "device_back",
  "imei_photo",
  "damage_photo",
  "accessories_photo",
  "other"
]);

export const requiredCompletionFileTypes = [
  "id_front",
  "device_front",
  "device_back"
] as const;

export const allowedDocumentMimeTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp"
] as const;

export const allowedDocumentExtensions = [".jpg", ".jpeg", ".png", ".webp"] as const;

export const allowedSignatureMimeTypes = ["image/png"] as const;

export const allowedUploadMimeTypes = [...allowedDocumentMimeTypes, ...allowedSignatureMimeTypes] as const;

const hasAllowedDocumentExtension = (filename: string) => {
  const lower = filename.toLowerCase();
  return allowedDocumentExtensions.some((ext) => lower.endsWith(ext));
};

export const isAllowedDocumentUpload = (mimetype: string, originalname: string) => {
  if (allowedDocumentMimeTypes.includes(mimetype as (typeof allowedDocumentMimeTypes)[number])) {
    return true;
  }

  // Mobile cameras and galleries sometimes omit MIME type or send application/octet-stream.
  if (!mimetype || mimetype === "application/octet-stream") {
    return hasAllowedDocumentExtension(originalname);
  }

  return false;
};

export const isAllowedUpload = (mimetype: string, originalname: string) => {
  if (allowedUploadMimeTypes.includes(mimetype as (typeof allowedUploadMimeTypes)[number])) {
    return true;
  }

  if (!mimetype || mimetype === "application/octet-stream") {
    return hasAllowedDocumentExtension(originalname) || originalname.toLowerCase().endsWith(".png");
  }

  return false;
};
