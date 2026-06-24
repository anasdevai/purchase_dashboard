import os from "node:os";
import { env } from "../config/env.js";

/**
 * Discovers the host computer's primary LAN IPv4 address.
 * Excludes loopbacks and virtualization adapters (VirtualBox, VMware, etc.).
 */
export const getLocalIpAddress = (): string => {
  const interfaces = os.networkInterfaces();
  const candidates: string[] = [];

  for (const name of Object.keys(interfaces)) {
    const iface = interfaces[name];
    if (!iface) continue;

    // Skip virtualized / loopback interface names
    const lowerName = name.toLowerCase();
    if (
      lowerName.includes("virtual") ||
      lowerName.includes("vbox") ||
      lowerName.includes("vmware") ||
      lowerName.includes("wsl") ||
      lowerName.includes("docker") ||
      lowerName.includes("loopback")
    ) {
      continue;
    }

    for (const config of iface) {
      if (config.family !== "IPv4" || config.internal) {
        continue;
      }

      // Skip Oracle VirtualBox MAC prefix (starts with 0a:00:27 or 08:00:27)
      const mac = config.mac ? config.mac.toLowerCase() : "";
      if (mac.startsWith("0a:00:27") || mac.startsWith("08:00:27")) {
        continue;
      }

      candidates.push(config.address);
    }
  }

  // Return the first valid candidate LAN IP
  if (candidates.length > 0) {
    return candidates[0];
  }

  // Fallback to first non-internal IPv4 if no candidate matches
  for (const name of Object.keys(interfaces)) {
    const iface = interfaces[name];
    if (!iface) continue;
    for (const config of iface) {
      if (config.family === "IPv4" && !config.internal) {
        return config.address;
      }
    }
  }

  return "127.0.0.1";
};

/**
 * Dynamically builds the QR Code signature URL for mobile browsers.
 * Replaces 'localhost', '127.0.0.1', or '::1' in the origin with the host's LAN IP.
 */
export const getSignatureUrl = (origin: string | undefined, token: string): string => {
  const lanIp = getLocalIpAddress();
  const baseOrigin = origin || env.frontendUrl || "http://localhost:5173";

  try {
    const url = new URL(baseOrigin);
    if (
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1" ||
      url.hostname === "::1"
    ) {
      url.hostname = lanIp;
    }
    // Remove trailing slash if present, set path
    url.pathname = `/signature/${token}`;
    return url.toString();
  } catch {
    return `http://${lanIp}:5173/signature/${token}`;
  }
};
