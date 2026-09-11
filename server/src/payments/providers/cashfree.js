import { createHmac } from "node:crypto";
import { HttpError } from "../../util.js";
import { safeEqual } from "../secrets.js";

const API_VERSION = "2025-01-01";

function baseUrl(env) {
  return env === "production" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg";
}

function digitsPhone(phone) {
  const d = String(phone || "").replace(/\D/g, "");
  if (d.length >= 10) return d.slice(-10);
  return "9999999999";
}

async function cashfreeRequest(cfg, method, path, body) {
  const res = await fetch(`${baseUrl(cfg.cashfree.env)}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-client-id": cfg.cashfree.appId,
      "x-client-secret": cfg.cashfree.secretKey,
      "x-api-version": API_VERSION,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message || data?.message_code || "Could not reach Cashfree. Please try again.";
    throw new HttpError(502, typeof msg === "string" ? msg : "Could not reach Cashfree. Please try again.", "GATEWAY_ERROR");
  }
  return data;
}

function mapOrderStatus(status) {
  const s = String(status || "").toUpperCase();
  if (s === "PAID") return "PAID";
  if (s === "EXPIRED" || s === "TERMINATED") return "CANCELLED";
  if (s === "ACTIVE" || s === "PENDING") return "PENDING";
  if (s === "CANCELLED") return "CANCELLED";
  return "PENDING";
}

export const cashfreeProvider = {
  name: "cashfree",

  async createOrder({ cfg, order, recruiter }) {
    const created = await cashfreeRequest(cfg, "POST", "/orders", {
      order_id: order.id,
      order_amount: Number(order.amount),
      order_currency: order.currency || "INR",
      customer_details: {
        customer_id: recruiter.id.replace(/-/g, "").slice(0, 50),
        customer_email: recruiter.email || "recruiter@example.com",
        customer_phone: digitsPhone(recruiter.phone),
        customer_name: recruiter.full_name || "Recruiter",
      },
      order_meta: {
        return_url: `${(process.env.CLIENT_ORIGIN || "http://localhost:5173").split(",")[0]}/dashboard/recruiter/packages?order_id={order_id}`,
      },
      order_note: order.package_name,
    });
    const sessionId = created.payment_session_id;
    if (!sessionId) throw new HttpError(502, "Cashfree did not return a checkout session.", "GATEWAY_ERROR");
    return {
      gatewayOrderId: created.order_id || order.id,
      checkout: {
        gateway: "cashfree",
        paymentSessionId: sessionId,
        orderId: created.order_id || order.id,
        mode: cfg.cashfree.env === "production" ? "production" : "sandbox",
      },
    };
  },

  verifyCheckoutSignature() {
    return false;
  },

  verifyWebhook(cfg, rawBody, headers) {
    const secret = cfg.cashfree.webhookSecret || cfg.cashfree.secretKey;
    if (!secret) throw new HttpError(400, "Webhook is not configured", "WEBHOOK_NOT_CONFIGURED");
    const signature = headers["x-webhook-signature"];
    const timestamp = headers["x-webhook-timestamp"];
    const body = Buffer.isBuffer(rawBody) ? rawBody.toString("utf8") : String(rawBody);
    const expected = createHmac("sha256", secret).update(timestamp + body).digest("base64");
    if (!safeEqual(expected, signature)) throw new HttpError(400, "Invalid webhook signature", "INVALID_WEBHOOK");
    return JSON.parse(body);
  },

  parseWebhookEvent(event) {
    const type = event?.type || event?.event;
    const data = event?.data || event;
    const order = data?.order || data;
    const payment = data?.payment || {};
    const gatewayOrderId = order.order_id || data.order_id;
    const gatewayPaymentId = payment.cf_payment_id || payment.payment_id;
    const orderStatus = mapOrderStatus(order.order_status || data.order_status);
    if (String(type).includes("SUCCESS") || orderStatus === "PAID") {
      return { gatewayOrderId, gatewayPaymentId, status: "PAID" };
    }
    if (String(type).includes("FAILED") || String(type).includes("USER_DROPPED")) {
      return { gatewayOrderId, gatewayPaymentId, status: String(type).includes("USER_DROPPED") ? "CANCELLED" : "FAILED" };
    }
    if (String(type).includes("REFUND")) {
      return { gatewayOrderId, gatewayPaymentId, status: "REFUNDED" };
    }
    if (orderStatus === "CANCELLED") return { gatewayOrderId, gatewayPaymentId, status: "CANCELLED" };
    return null;
  },

  async getPaymentStatus(cfg, { gatewayOrderId }) {
    if (!gatewayOrderId) return { status: "PENDING" };
    const order = await cashfreeRequest(cfg, "GET", `/orders/${gatewayOrderId}`);
    return {
      status: mapOrderStatus(order.order_status),
      gatewayOrderId: order.order_id,
      gatewayPaymentId: order.cf_order_id ? String(order.cf_order_id) : undefined,
    };
  },
};
