import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

const SENSITIVE_KEYS = [
  "apiKey",
  "secret",
  "password",
  "accessToken",
  "refreshToken",
  "clientSecret",
  "tokenId",
  "token",
  "privateKey",
  "passphrase",
];

function getKey(): Buffer {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.trim().length < 16) {
    throw new Error("System configuration failure: ENCRYPTION_KEY is unconfigured or possesses insufficient entropy (min 16 chars required).");
  }
  return crypto.scryptSync(ENCRYPTION_KEY, "mindmatrix-salt", 32);
}

export function encrypt(text: string): string {
  const key = getKey();
  if (!key || !text) return text;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  const key = getKey();
  if (!key || !encryptedText) return encryptedText;
  const parts = encryptedText.split(":");
  if (parts.length !== 3) return encryptedText;
  try {
    const [ivHex, authTagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    return encryptedText;
  }
}

export function encryptConfig(config: Record<string, string>): Record<string, string> {
  const result = { ...config };
  for (const key of SENSITIVE_KEYS) {
    if (result[key] && typeof result[key] === "string" && result[key] !== "••••••••") {
      result[key] = encrypt(result[key]);
    }
  }
  return result;
}

export function decryptConfig(config: Record<string, string>): Record<string, string> {
  const result = { ...config };
  for (const key of SENSITIVE_KEYS) {
    if (result[key] && typeof result[key] === "string") {
      result[key] = decrypt(result[key]);
    }
  }
  return result;
}

export function maskConfig(config: Record<string, string>): Record<string, string> {
  const result = { ...config };
  for (const key of SENSITIVE_KEYS) {
    if (result[key]) {
      result[key] = "••••••••";
    }
  }
  return result;
}
