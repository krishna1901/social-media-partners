import "server-only";
import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";

/**
 * Authenticated symmetric encryption for sensitive secrets (OAuth tokens).
 *
 * AES-256-GCM. The key is derived (SHA-256) from the server-only
 * `TOKEN_ENCRYPTION_KEY` so any sufficiently-long passphrase works. Payload
 * format: `v1:<iv b64>:<authTag b64>:<ciphertext b64>`.
 *
 * NEVER import into client code. NEVER store the key in NEXT_PUBLIC_.
 */

function deriveKey(): Buffer | null {
  // `SOCIAL_TOKEN_ENCRYPTION_KEY` is an additive alias for `TOKEN_ENCRYPTION_KEY`
  // (set only one; they must match if both are set — rotating invalidates stored
  // tokens). `TOKEN_ENCRYPTION_KEY` wins for back-compat with existing deploys.
  const raw = process.env.TOKEN_ENCRYPTION_KEY || process.env.SOCIAL_TOKEN_ENCRYPTION_KEY;
  if (!raw || raw.length < 16) return null;
  return createHash("sha256").update(raw).digest(); // 32 bytes
}

/** True when a usable encryption key is configured. */
export function isEncryptionConfigured(): boolean {
  return deriveKey() !== null;
}

/** Encrypt a plaintext secret. Throws when no key is configured. */
export function encryptSecret(plaintext: string): string {
  const key = deriveKey();
  if (!key) throw new Error("TOKEN_ENCRYPTION_KEY is not set (min 16 chars).");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`;
}

/** Decrypt a payload produced by `encryptSecret`. Throws on tamper/key issues. */
export function decryptSecret(payload: string): string {
  const key = deriveKey();
  if (!key) throw new Error("TOKEN_ENCRYPTION_KEY is not set (min 16 chars).");
  const [version, ivB64, tagB64, dataB64] = payload.split(":");
  if (version !== "v1" || !ivB64 || !tagB64 || !dataB64) {
    throw new Error("Unrecognized encrypted payload format.");
  }
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const dec = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]);
  return dec.toString("utf8");
}
