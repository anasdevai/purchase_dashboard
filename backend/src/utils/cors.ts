import { env } from "../config/env.js";

/** Vite dev server on localhost, Tailscale/CGNAT (100.x), or common private IPv4 ranges. */
const LAN_FRONTEND_ORIGIN =
  /^http:\/\/(localhost|127\.0\.0\.1|100\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:5173|:\d+)?$/;

export const isCorsOriginAllowed = (origin: string | undefined) => {
  if (!origin) return true;
  if (env.corsOrigins.includes(origin)) return true;
  if (env.CORS_ALLOW_LAN && LAN_FRONTEND_ORIGIN.test(origin)) return true;
  return false;
};
