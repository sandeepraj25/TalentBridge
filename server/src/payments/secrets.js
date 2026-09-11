import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { config } from "../config.js";

const PREFIX = "enc:v1:";

function keyBuf() {
  return createHash("sha256").update(String(config.paymentEncryptionKey || "")).digest();
}

export function encryptSecret(plain) {
  if (plain == null || plain === "") return "";
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyBuf(), iv);
  const enc = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("hex")}:${tag.toString("hex")}:${enc.toString("hex")}`;
}

export function decryptSecret(stored) {
  if (!stored) return "";
  const value = String(stored);
  if (!value.startsWith(PREFIX)) return value;
  try {
    const rest = value.slice(PREFIX.length);
    const [ivHex, tagHex, dataHex] = rest.split(":");
    const decipher = createDecipheriv("aes-256-gcm", keyBuf(), Buffer.from(ivHex, "hex"));
    decipher.setAuthTag(Buffer.from(tagHex, "hex"));
    return Buffer.concat([decipher.update(Buffer.from(dataHex, "hex")), decipher.final()]).toString("utf8");
  } catch {
    return "";
  }
}

export function safeEqual(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  if (left.length !== right.length) return false;
  try {
    return timingSafeEqual(left, right);
  } catch {
    return false;
  }
}
