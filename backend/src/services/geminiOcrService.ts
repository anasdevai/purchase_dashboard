import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import mammoth from "mammoth";
import WordExtractor from "word-extractor";
import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";
import { parseOcrDateToIso } from "../utils/ocrDate.utils.js";
import type { OcrFileCategory } from "../utils/ocrFile.utils.js";

export type RepairOrderOcrData = {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  deviceType: string;
  brand: string;
  model: string;
  imei: string;
  serialNumber: string;
  devicePassword: string;
  accessories: string;
  problemDescription: string;
  visibleDamage: string;
  technicianNotes: string;
  estimatedPrice: number | null;
  depositAmount: number | null;
  expectedCompletionDate: string;
};

export type RepairOrderOcrResult = {
  data: RepairOrderOcrData;
  confidence: number;
  unclearFields: string[];
};

type GeminiAccessories = {
  charger?: boolean;
  controller?: boolean;
  carryingCase?: boolean;
  powerSupply?: boolean;
  cable?: boolean;
  other?: boolean;
  otherText?: string | null;
};

type GeminiExtraction = {
  customerName?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  address?: string | null;
  deviceType?: string | null;
  deviceTypeOther?: string | null;
  brand?: string | null;
  model?: string | null;
  imeiOrSerialNumber?: string | null;
  imei?: string | null;
  serialNumber?: string | null;
  passwordOrPin?: string | null;
  devicePassword?: string | null;
  accessories?: GeminiAccessories | string | null;
  problemDescription?: string | null;
  visibleDamage?: string | null;
  technicianNotes?: string | null;
  estimatedPrice?: number | string | null;
  depositOrAdvancePayment?: number | string | null;
  depositAmount?: number | string | null;
  expectedCompletionDate?: string | null;
  completionDate?: string | null;
  date?: string | null;
  confidence?: number | null;
  unclearFields?: string[] | null;
};

const EMPTY_DATA: RepairOrderOcrData = {
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  customerAddress: "",
  deviceType: "",
  brand: "",
  model: "",
  imei: "",
  serialNumber: "",
  devicePassword: "",
  accessories: "",
  problemDescription: "",
  visibleDamage: "",
  technicianNotes: "",
  estimatedPrice: null,
  depositAmount: null,
  expectedCompletionDate: "",
};

const GEMINI_SCHEMA = {
  customerName: null,
  phoneNumber: null,
  email: null,
  address: null,
  deviceType: null,
  deviceTypeOther: null,
  brand: null,
  model: null,
  imeiOrSerialNumber: null,
  passwordOrPin: null,
  accessories: {
    charger: false,
    controller: false,
    carryingCase: false,
    powerSupply: false,
    cable: false,
    other: false,
    otherText: null,
  },
  problemDescription: null,
  visibleDamage: null,
  technicianNotes: null,
  estimatedPrice: null,
  depositOrAdvancePayment: null,
  expectedCompletionDate: null,
  confidence: 0,
  unclearFields: [],
};

const FALLBACK_GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"] as const;

const isDev = process.env.NODE_ENV !== "production";

const EXTRACTION_PROMPT = `You are an OCR and document extraction assistant for a repair order / device purchase contract app.

Extract the required fields from the uploaded image, PDF, or document.
The form may be in German or English.
The form may be scanned, handwritten, or photographed.
Return only valid JSON.
Do not add explanation.
If a value is not found or unclear, return null.
If handwriting is unclear, add the field name inside unclearFields.
Use the exact JSON schema provided.
For confidence, return a number from 0 to 100 based on extraction quality.

Device type should be one of:
Laptop, PC, MacBook, iMac, Xbox, PlayStation, Nintendo, Mobile, Tablet, iPhone, Samsung phone, iPad, Android tablet, Windows laptop, Nintendo Switch, Other, null.

Dates should be returned in YYYY-MM-DD format when possible.
Phone numbers should be returned as written if country code is unclear.
Estimated price and deposit should be numeric if possible.

expectedCompletionDate is the expected completion / pickup date on the form
(for example: "Expected completion date", "Fertigstellungsdatum", "voraussichtliches Fertigstellungsdatum").
Return it in YYYY-MM-DD format when the full date is clear.
If only part of the date is readable, return null and add "expectedCompletionDate" to unclearFields.

JSON schema:
${JSON.stringify(GEMINI_SCHEMA, null, 2)}`;

function getGeminiModelCandidates() {
  const configured = env.GEMINI_MODEL.trim();
  const candidates = [configured, ...FALLBACK_GEMINI_MODELS.filter((model) => model !== configured)];
  return [...new Set(candidates)];
}

function createGenerativeModel(modelName: string) {
  const apiKey = env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new HttpError(500, "OCR is not configured. Set GEMINI_API_KEY in the backend environment.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
    },
  });
}

function isRetryableModelError(error: unknown) {
  const err = error as { status?: number; message?: string };
  const message = err.message || "";
  return (
    err.status === 404 ||
    err.status === 503 ||
    /not found/i.test(message) ||
    /high demand/i.test(message) ||
    /unavailable/i.test(message)
  );
}

function parseJsonResponse(text: string) {
  const trimmed = text.trim();
  const jsonBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const payload = jsonBlock ? jsonBlock[1].trim() : trimmed;
  const parsed = JSON.parse(payload) as GeminiExtraction;

  return {
    ...parsed,
    accessories:
      typeof parsed.accessories === "object" && parsed.accessories !== null
        ? parsed.accessories
        : parsed.accessories,
    unclearFields: Array.isArray(parsed.unclearFields) ? parsed.unclearFields : [],
  };
}

function asString(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function asNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function serializeAccessories(accessories: GeminiExtraction["accessories"]) {
  if (!accessories) return "";
  if (typeof accessories === "string") return accessories.trim();

  const parts: string[] = [];
  if (accessories.charger) parts.push("charger");
  if (accessories.powerSupply) parts.push("powerSupply");
  if (accessories.controller) parts.push("controller");
  if (accessories.cable) parts.push("cable");
  if (accessories.carryingCase) parts.push("carryingCase");
  if (accessories.other) {
    const otherText = asString(accessories.otherText);
    parts.push(otherText ? `other:${otherText}` : "other");
  }

  return parts.join(",");
}

function splitImeiAndSerial(raw: GeminiExtraction) {
  const imei = asString(raw.imei);
  const serial = asString(raw.serialNumber);
  if (imei || serial) {
    return { imei, serialNumber: serial };
  }

  const combined = asString(raw.imeiOrSerialNumber);
  if (!combined) return { imei: "", serialNumber: "" };

  const digitsOnly = combined.replace(/\s/g, "");
  if (/^\d{15}$/.test(digitsOnly)) {
    return { imei: combined, serialNumber: "" };
  }

  return { imei: "", serialNumber: combined };
}

function resolveExpectedCompletionDate(raw: GeminiExtraction) {
  const candidates = [raw.expectedCompletionDate, raw.completionDate, raw.date]
    .map((value) => asString(value))
    .filter(Boolean);

  if (candidates.length === 0) {
    return { value: "", addUnclear: false };
  }

  for (const candidate of candidates) {
    const parsed = parseOcrDateToIso(candidate);
    if (parsed) {
      return { value: parsed, addUnclear: false };
    }
  }

  return { value: "", addUnclear: true };
}

function normalizeExtraction(raw: GeminiExtraction): RepairOrderOcrResult {
  const { imei, serialNumber } = splitImeiAndSerial(raw);
  const deviceType = asString(raw.deviceType) || asString(raw.deviceTypeOther);
  const expectedCompletionDate = resolveExpectedCompletionDate(raw);
  const unclearFields = Array.isArray(raw.unclearFields)
    ? raw.unclearFields.map((field) => String(field))
    : [];

  if (
    expectedCompletionDate.addUnclear &&
    !unclearFields.some((field) => field.toLowerCase() === "expectedcompletiondate")
  ) {
    unclearFields.push("expectedCompletionDate");
  }

  return {
    data: {
      customerName: asString(raw.customerName),
      customerPhone: asString(raw.phoneNumber),
      customerEmail: asString(raw.email),
      customerAddress: asString(raw.address),
      deviceType,
      brand: asString(raw.brand),
      model: asString(raw.model),
      imei,
      serialNumber,
      devicePassword: asString(raw.passwordOrPin) || asString(raw.devicePassword),
      accessories: serializeAccessories(raw.accessories),
      problemDescription: asString(raw.problemDescription),
      visibleDamage: asString(raw.visibleDamage),
      technicianNotes: asString(raw.technicianNotes),
      estimatedPrice: asNumber(raw.estimatedPrice),
      depositAmount: asNumber(raw.depositOrAdvancePayment ?? raw.depositAmount),
      expectedCompletionDate: expectedCompletionDate.value,
    },
    confidence: Number.isFinite(Number(raw.confidence)) ? Number(raw.confidence) : 0,
    unclearFields,
  };
}

function formatGeminiError(error: unknown): HttpError {
  if (error instanceof HttpError) return error;

  const err = error as { message?: string; status?: number; errorDetails?: Array<{ message?: string }> };
  const message = err.message || err.errorDetails?.[0]?.message || "Gemini API request failed";

  if (/api key/i.test(message) || err.status === 401 || err.status === 403) {
    return new HttpError(500, "Invalid or unauthorized Gemini API key.");
  }

  if (err.status === 404 || /not found/i.test(message)) {
    return new HttpError(500, `Gemini model not found: ${env.GEMINI_MODEL}`);
  }

  return new HttpError(500, message);
}

async function extractFromGemini(parts: Array<string | { text: string } | { inlineData: { data: string; mimeType: string } }>) {
  const modelCandidates = getGeminiModelCandidates();
  let lastError: unknown;

  for (const modelName of modelCandidates) {
    try {
      const model = createGenerativeModel(modelName);
      const result = await model.generateContent([EXTRACTION_PROMPT, ...parts]);
      const text = result.response.text();
      if (!text) {
        throw new HttpError(500, "Gemini returned an empty response");
      }

      const normalized = normalizeExtraction(parseJsonResponse(text));
      if (isDev && modelName !== modelCandidates[0]) {
        console.log(`[ocr:dev] Primary model "${modelCandidates[0]}" failed; used fallback "${modelName}"`);
      }
      return normalized;
    } catch (error) {
      lastError = error;
      if (error instanceof HttpError) {
        throw error;
      }

      const isLastCandidate = modelName === modelCandidates[modelCandidates.length - 1];
      if (!isLastCandidate && isRetryableModelError(error)) {
        if (isDev) {
          const message = (error as { message?: string }).message || "unknown error";
          console.warn(`[ocr:dev] Model "${modelName}" unavailable: ${message}`);
        }
        continue;
      }

      throw formatGeminiError(error);
    }
  }

  throw formatGeminiError(lastError);
}

async function extractFromImageOrPdfBuffer(buffer: Buffer, mimeType: string) {
  return extractFromGemini([
    {
      inlineData: {
        data: buffer.toString("base64"),
        mimeType,
      },
    },
  ]);
}

async function extractFromDocumentText(text: string) {
  const cleaned = text.trim();
  if (!cleaned) {
    throw new HttpError(400, "No readable text found in the document");
  }

  return extractFromGemini([{ text: `Document text:\n\n${cleaned}` }]);
}

async function extractTextFromDocxBuffer(buffer: Buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return result.value || "";
}

async function extractTextFromDocBuffer(buffer: Buffer) {
  const tempPath = path.join(os.tmpdir(), `ocr-${Date.now()}.doc`);
  try {
    await fs.writeFile(tempPath, buffer);
    const extractor = new WordExtractor();
    const doc = await extractor.extract(tempPath);
    return doc.getBody() || "";
  } catch {
    throw new HttpError(
      400,
      "Could not read .doc file. DOC support is limited — please upload DOCX, PDF, or an image instead.",
    );
  } finally {
    await fs.unlink(tempPath).catch(() => undefined);
  }
}

export async function extractRepairOrderFromFile(
  buffer: Buffer,
  category: OcrFileCategory,
  mimeType: string,
): Promise<RepairOrderOcrResult> {
  if (category === "image" || category === "pdf") {
    return extractFromImageOrPdfBuffer(buffer, mimeType);
  }

  if (category === "docx") {
    const text = await extractTextFromDocxBuffer(buffer);
    return extractFromDocumentText(text);
  }

  if (category === "doc") {
    const text = await extractTextFromDocBuffer(buffer);
    return extractFromDocumentText(text);
  }

  throw new HttpError(400, "Unsupported file type for OCR");
}

export { EMPTY_DATA };
