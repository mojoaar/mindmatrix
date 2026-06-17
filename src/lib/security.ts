import dns from "dns";
import { promisify } from "util";

const lookupAsync = promisify(dns.lookup);

// List of RFC 1918, link-local, loopback, and multicast subnets
const PRIVATE_IP_RANGES = [
  /^127\./,                 // Loopback (IPv4)
  /^10\./,                  // Class A Private (IPv4)
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Class B Private (IPv4)
  /^192\.168\./,            // Class C Private (IPv4)
  /^169\.254\./,            // Link-local (IPv4)
  /^fc00:/,                 // Unique Local Address (IPv6)
  /^fe80:/,                 // Link-local (IPv6)
  /^::1$/,                  // Loopback (IPv6)
  /^0\./,                   // Broadcast (IPv4)
];

export async function isSafeUrl(urlStr: string): Promise<boolean> {
  if (process.env.ALLOW_PRIVATE_IP_WEBHOOKS === "true") {
    return true; // Bypass SSRF filter for self-hosted home-servers
  }

  try {
    const url = new URL(urlStr);
    const hostname = url.hostname;

    // Resolve hostname to IP address
    const lookup = await lookupAsync(hostname);
    const ip = lookup.address;

    // Check against all private/reserved ranges
    for (const range of PRIVATE_IP_RANGES) {
      if (range.test(ip)) {
        return false; // Forbidden IP target
      }
    }

    return true; // Hostname resolved to safe public internet address
  } catch {
    return false; // Abort on invalid URL/DNS parse failures
  }
}

export async function getSafeResolvedUrl(urlStr: string): Promise<{ url: string; host: string } | null> {
  if (process.env.ALLOW_PRIVATE_IP_WEBHOOKS === "true") {
    try {
      const url = new URL(urlStr);
      return { url: urlStr, host: url.hostname };
    } catch {
      return null;
    }
  }

  try {
    const url = new URL(urlStr);
    const hostname = url.hostname;

    // Resolve hostname to IP address
    const lookup = await lookupAsync(hostname);
    const ip = lookup.address;

    // Check against all private/reserved ranges
    for (const range of PRIVATE_IP_RANGES) {
      if (range.test(ip)) {
        return null; // Forbidden IP target
      }
    }

    // Rewrite the host to the resolved safe IP to prevent DNS rebinding TOCTOU
    const secureUrl = `${url.protocol}//${ip}${url.pathname}${url.search}`;
    return { url: secureUrl, host: hostname };
  } catch {
    return null; // Abort on invalid URL/DNS parse failures
  }
}
