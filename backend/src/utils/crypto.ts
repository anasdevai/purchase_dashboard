import crypto from "node:crypto";

const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

const getEncryptionKey = (): Buffer => {
  const secret = process.env.ENCRYPTION_KEY || "default_encryption_secret_key_32_chars_long!!";
  return crypto.createHash("sha256").update(secret).digest();
};

export const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
};

export const decrypt = (hash: string): string => {
  const parts = hash.split(":");
  if (parts.length !== 2) {
    throw new Error("Invalid encrypted text format");
  }
  const iv = Buffer.from(parts[0], "hex");
  const encryptedText = parts[1];
  const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};
