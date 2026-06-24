import { env } from "../config/env.js";

/** Vite dev server on localhost or common private IPv4 ranges. */
const LAN_FRONTEND_ORIGIN =
  /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/;

export const isCorsOriginAllowed = (origin: string | undefined) => {
  if (!origin || origin === "null" || origin.startsWith("file://")) return true;
  if (env.corsOrigins.includes(origin)) return true;
  if (env.CORS_ALLOW_LAN && LAN_FRONTEND_ORIGIN.test(origin)) return true;
  return false;
};
