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
  "id_back",
  "device_front",
  "device_back",
  "imei_photo",
  "damage_photo",
  "accessories_photo"
] as const;

export const allowedDocumentMimeTypes = ["image/png", "image/svg+xml"] as const;

export const allowedSignatureMimeTypes = ["image/png"] as const;

export const allowedUploadMimeTypes = [...allowedDocumentMimeTypes, ...allowedSignatureMimeTypes] as const;
