import { describe, it, expect, beforeAll } from "vitest";

// crypto.ts reads ENCRYPTION_KEY at import time from process.env
process.env.ENCRYPTION_KEY = "test-encryption-key-32-bytes-minimum";

import { encrypt, decrypt, encryptConfig, decryptConfig, maskConfig } from "@/lib/crypto";

describe("encrypt / decrypt", () => {
  it("should encrypt and decrypt roundtrip successfully", () => {
    const plaintext = "my-secret-api-key-12345";
    const encrypted = encrypt(plaintext);
    expect(encrypted).not.toBe(plaintext);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it("should produce different IVs for each encryption call", () => {
    const a = encrypt("hello");
    const b = encrypt("hello");
    expect(a).not.toBe(b);
    const partsA = a.split(":");
    const partsB = b.split(":");
    expect(partsA[0]).not.toBe(partsB[0]); // different IVs
  });

  it("should return the original text when decrypting untampered input", () => {
    const encrypted = encrypt("test123");
    const parts = encrypted.split(":");
    // change last byte of authTag
    const tampered = `${parts[0]}:ff${parts[1].slice(2)}:${parts[2]}`;
    const result = decrypt(tampered);
    expect(result).toBe(tampered); // returns original (malformed) input on failure
  });

  it("should return the original string when decrypting a non-encrypted value", () => {
    const plain = "just-a-regular-string";
    expect(decrypt(plain)).toBe(plain);
  });

  it("should return the original string when decrypting empty string", () => {
    expect(decrypt("")).toBe("");
  });

  it("should return the original text when encrypt receives empty string", () => {
    expect(encrypt("")).toBe("");
  });
});

describe("encryptConfig / decryptConfig / maskConfig", () => {
  it("should encrypt sensitive keys and decrypt them back", () => {
    const config = { apiKey: "sk-abc123", name: "My Plugin", enabled: true };
    const encrypted = encryptConfig(config);
    expect(encrypted.apiKey).not.toBe("sk-abc123");
    expect(encrypted.name).toBe("My Plugin");
    expect(encrypted.enabled).toBe(true);

    const decrypted = decryptConfig(encrypted);
    expect(decrypted.apiKey).toBe("sk-abc123");
  });

  it("should not double-encrypt masked sentinel values", () => {
    const config = { apiKey: "••••••••", name: "Test" };
    const encrypted = encryptConfig(config);
    expect(encrypted.apiKey).toBe("••••••••");
    expect(encrypted.name).toBe("Test");
  });

  it("should mask all sensitive keys with the sentinel string", () => {
    const config = { apiKey: "sk-secret", password: "pass123", name: "visible" };
    const masked = maskConfig(config);
    expect(masked.apiKey).toBe("••••••••");
    expect(masked.password).toBe("••••••••");
    expect(masked.name).toBe("visible");
  });

  it("should roundtrip encryptConfig → decryptConfig for all sensitive key types", () => {
    const config = {
      apiKey: "key-1",
      secret: "secret-1",
      password: "pwd",
      accessToken: "token-1",
      refreshToken: "refresh-1",
      clientSecret: "cs-1",
      tokenId: "tid-1",
      token: "tok-1",
      privateKey: "pk-1",
      passphrase: "phrase-1",
      name: "public-name",
    };
    const encrypted = encryptConfig(config);
    const decrypted = decryptConfig(encrypted);
    expect(decrypted).toEqual(config);
  });

  it("should handle missing/undefined sensitive keys gracefully", () => {
    const config = { name: "just-name" };
    const encrypted = encryptConfig(config);
    expect(encrypted).toEqual({ name: "just-name" });
    const decrypted = decryptConfig(config);
    expect(decrypted).toEqual({ name: "just-name" });
    const masked = maskConfig(config);
    expect(masked).toEqual({ name: "just-name" });
  });
});
