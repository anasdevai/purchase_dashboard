import { env } from "../config/env.js";

/** Vite dev server on localhost, Tailscale/CGNAT (100.x), or common private IPv4 ranges. */
const LAN_FRONTEND_ORIGIN =
  /^http:\/\/(localhost|127\.0\.0\.1|100\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/;

/** Origins from CORS_ORIGINS plus FRONTEND_URL when not already listed. */
export const getConfiguredCorsOrigins = (): string[] => {
  const origins = [...env.corsOrigins];
  if (env.frontendUrl && !origins.includes(env.frontendUrl)) {
    origins.push(env.frontendUrl);
  }
  return origins;
};

export const isCorsOriginAllowed = (origin: string | undefined) => {
  // Allow curl, Postman, and server-to-server requests without an Origin header.
  if (!origin) return true;
  if (getConfiguredCorsOrigins().includes(origin)) return true;
  if (env.CORS_ALLOW_LAN && env.NODE_ENV !== "production" && LAN_FRONTEND_ORIGIN.test(origin)) {
    return true;
  }
  return false;
};
