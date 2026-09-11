import { query, queryOne } from "../db.js";
import { config } from "../config.js";
import { parseJson, HttpError } from "../util.js";
import { decryptSecret, encryptSecret } from "./secrets.js";
import { GATEWAYS, maskSecret, normalizeActiveGateway } from "./logic.js";

const SETTINGS_KEY = "payment_gateway";

function emptyStored() {
  return {
    activeGateway: "",
    razorpay: { keyId: "", secretKey: "", webhookSecret: "" },
    cashfree: { appId: "", secretKey: "", webhookSecret: "", env: "sandbox" },
  };
}

async function readStored() {
  const row = await queryOne("SELECT value FROM settings WHERE `key`=?", [SETTINGS_KEY]);
  const parsed = parseJson(row?.value, {});
  const base = emptyStored();
  return {
    activeGateway: parsed.activeGateway || "",
    razorpay: { ...base.razorpay, ...(parsed.razorpay || {}) },
    cashfree: { ...base.cashfree, ...(parsed.cashfree || {}) },
  };
}

function decryptGateway(stored) {
  return {
    activeGateway: stored.activeGateway || "",
    razorpay: {
      keyId: stored.razorpay.keyId || "",
      secretKey: decryptSecret(stored.razorpay.secretKey),
      webhookSecret: decryptSecret(stored.razorpay.webhookSecret),
    },
    cashfree: {
      appId: stored.cashfree.appId || "",
      secretKey: decryptSecret(stored.cashfree.secretKey),
      webhookSecret: decryptSecret(stored.cashfree.webhookSecret),
      env: stored.cashfree.env === "production" ? "production" : "sandbox",
    },
  };
}

function withEnvFallback(decrypted) {
  const env = config.payments;
  return {
    activeGateway: decrypted.activeGateway || env.activeGateway || "",
    razorpay: {
      keyId: decrypted.razorpay.keyId || env.razorpay.keyId,
      secretKey: decrypted.razorpay.secretKey || env.razorpay.keySecret,
      webhookSecret: decrypted.razorpay.webhookSecret || env.razorpay.webhookSecret,
    },
    cashfree: {
      appId: decrypted.cashfree.appId || env.cashfree.appId,
      secretKey: decrypted.cashfree.secretKey || env.cashfree.secretKey,
      webhookSecret: decrypted.cashfree.webhookSecret || env.cashfree.webhookSecret,
      env: decrypted.cashfree.appId ? decrypted.cashfree.env : decrypted.cashfree.env || env.cashfree.env,
    },
  };
}

export async function getPaymentGatewayConfig() {
  const stored = await readStored();
  return withEnvFallback(decryptGateway(stored));
}

export async function getPublicAdminPaymentSettings() {
  const cfg = await getPaymentGatewayConfig();
  return {
    activeGateway: GATEWAYS.includes(cfg.activeGateway) ? cfg.activeGateway : "",
    razorpay: {
      keyId: cfg.razorpay.keyId || "",
      secretKeyMasked: maskSecret(cfg.razorpay.secretKey),
      secretKeyConfigured: Boolean(cfg.razorpay.secretKey),
      webhookSecretMasked: maskSecret(cfg.razorpay.webhookSecret),
      webhookSecretConfigured: Boolean(cfg.razorpay.webhookSecret),
    },
    cashfree: {
      appId: cfg.cashfree.appId || "",
      secretKeyMasked: maskSecret(cfg.cashfree.secretKey),
      secretKeyConfigured: Boolean(cfg.cashfree.secretKey),
      webhookSecretMasked: maskSecret(cfg.cashfree.webhookSecret),
      webhookSecretConfigured: Boolean(cfg.cashfree.webhookSecret),
      env: cfg.cashfree.env || "sandbox",
    },
  };
}

export async function savePaymentGatewaySettings(body) {
  const activeGateway = normalizeActiveGateway(body.activeGateway);
  const stored = await readStored();
  const keep = decryptGateway(stored);

  const razorpaySecret = body.razorpay?.secretKey ? String(body.razorpay.secretKey) : keep.razorpay.secretKey;
  const razorpayWebhook = body.razorpay?.webhookSecret ? String(body.razorpay.webhookSecret) : keep.razorpay.webhookSecret;
  const cashfreeSecret = body.cashfree?.secretKey ? String(body.cashfree.secretKey) : keep.cashfree.secretKey;
  const cashfreeWebhook = body.cashfree?.webhookSecret ? String(body.cashfree.webhookSecret) : keep.cashfree.webhookSecret;

  const next = {
    activeGateway,
    razorpay: {
      keyId: String(body.razorpay?.keyId ?? keep.razorpay.keyId ?? "").trim(),
      secretKey: encryptSecret(razorpaySecret),
      webhookSecret: encryptSecret(razorpayWebhook),
    },
    cashfree: {
      appId: String(body.cashfree?.appId ?? keep.cashfree.appId ?? "").trim(),
      secretKey: encryptSecret(cashfreeSecret),
      webhookSecret: encryptSecret(cashfreeWebhook),
      env: body.cashfree?.env === "production" ? "production" : "sandbox",
    },
  };

  await query(
    "INSERT INTO settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value=VALUES(value)",
    [SETTINGS_KEY, JSON.stringify(next)]
  );
  return getPublicAdminPaymentSettings();
}

export async function getActiveGatewayOrThrow() {
  const cfg = await getPaymentGatewayConfig();
  if (!cfg.activeGateway) {
    throw new HttpError(400, "No payment gateway is configured. Please contact support.", "NO_GATEWAY");
  }
  let gateway;
  try {
    gateway = normalizeActiveGateway(cfg.activeGateway);
  } catch {
    throw new HttpError(400, "No payment gateway is configured. Please contact support.", "NO_GATEWAY");
  }

  if (gateway === "razorpay") {
    if (!cfg.razorpay.keyId || !cfg.razorpay.secretKey) {
      throw new HttpError(400, "Razorpay is not fully configured. Please contact support.", "GATEWAY_NOT_CONFIGURED");
    }
  } else if (!cfg.cashfree.appId || !cfg.cashfree.secretKey) {
    throw new HttpError(400, "Cashfree is not fully configured. Please contact support.", "GATEWAY_NOT_CONFIGURED");
  }

  return { gateway, cfg };
}
