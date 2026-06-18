import os from "node:os";

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

      const mac = config.mac ? config.mac.toLowerCase() : "";
      if (mac.startsWith("0a:00:27") || mac.startsWith("08:00:27")) {
        continue;
      }

      candidates.push(config.address);
    }
  }

  if (candidates.length > 0) {
    const tailscale = candidates.find((ip) => {
      const [first, second] = ip.split(".").map(Number);
      return first === 100 && second >= 64 && second <= 127;
    });
    if (tailscale) return tailscale;

    const privateLan = candidates.find((ip) => ip.startsWith("192.168.") || ip.startsWith("10."));
    if (privateLan) return privateLan;

    return candidates[0];
  }

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
 * Builds the QR Code signature URL for mobile browsers.
 * Replaces localhost with the host's LAN IP when needed.
 */
const isLoopbackHost = (hostname: string) =>
  hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";

export const getSignatureUrl = (origin: string | undefined, token: string): string => {
  const lanIp = getLocalIpAddress();
  const fallback = `http://${lanIp}:5173/signature/${token}`;

  if (!origin) {
    return fallback;
  }

  try {
    const url = new URL(origin);
    if (isLoopbackHost(url.hostname)) {
      url.hostname = lanIp;
    }
    url.pathname = `/signature/${token}`;
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return fallback;
  }
};
