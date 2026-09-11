import { createHmac } from "node:crypto";
import { HttpError } from "../../util.js";
import { rupeesToPaise } from "../logic.js";
import { safeEqual } from "../secrets.js";

function authHeader(keyId, secret) {
  return `Basic ${Buffer.from(`${keyId}:${secret}`).toString("base64")}`;
}

async function razorpayRequest(cfg, method, path, body) {
  const res = await fetch(`https://api.razorpay.com/v1${path}`, {
    method,
    headers: {
      Authorization: authHeader(cfg.razorpay.keyId, cfg.razorpay.secretKey),
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.description || "Could not reach Razorpay. Please try again.";
    throw new HttpError(502, msg, "GATEWAY_ERROR");
  }
  return data;
}

export const razorpayProvider = {
  name: "razorpay",

  async createOrder({ cfg, order, recruiter }) {
    const amountPaise = rupeesToPaise(order.amount);
    const created = await razorpayRequest(cfg, "POST", "/orders", {
      amount: amountPaise,
      currency: order.currency || "INR",
      receipt: String(order.id).replace(/-/g, "").slice(0, 40),
      notes: {
        recruiter_id: recruiter.id,
        package_id: order.package_id,
        plan: order.package_name,
      },
    });
    return {
      gatewayOrderId: created.id,
      checkout: {
        gateway: "razorpay",
        keyId: cfg.razorpay.keyId,
        orderId: created.id,
        amount: amountPaise,
        currency: created.currency || "INR",
        name: order.package_name,
        description: `${order.package_name} plan`,
        prefill: {
          name: recruiter.full_name || "",
          email: recruiter.email || "",
          contact: recruiter.phone || "",
        },
      },
    };
  },

  verifyCheckoutSignature(cfg, payload) {
    const orderId = payload.razorpay_order_id;
    const paymentId = payload.razorpay_payment_id;
    const signature = payload.razorpay_signature;
    if (!orderId || !paymentId || !signature) return false;
    const expected = createHmac("sha256", cfg.razorpay.secretKey)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");
    return safeEqual(expected, signature);
  },

  verifyWebhook(cfg, rawBody, headers) {
    const secret = cfg.razorpay.webhookSecret;
    if (!secret) throw new HttpError(400, "Webhook is not configured", "WEBHOOK_NOT_CONFIGURED");
    const signature = headers["x-razorpay-signature"];
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    if (!safeEqual(expected, signature)) throw new HttpError(400, "Invalid webhook signature", "INVALID_WEBHOOK");
    return JSON.parse(Buffer.isBuffer(rawBody) ? rawBody.toString("utf8") : String(rawBody));
  },

  parseWebhookEvent(event) {
    const type = event?.event;
    const entity = event?.payload?.payment?.entity || event?.payload?.order?.entity || {};
    const gatewayOrderId = entity.order_id || entity.id;
    const gatewayPaymentId = entity.entity === "payment" ? entity.id : entity.id;
    if (type === "payment.captured" || type === "order.paid") {
      return { gatewayOrderId: entity.order_id || gatewayOrderId, gatewayPaymentId: entity.id, status: "PAID" };
    }
    if (type === "payment.failed") {
      return { gatewayOrderId: entity.order_id, gatewayPaymentId: entity.id, status: "FAILED" };
    }
    if (type === "refund.processed" || type === "refund.created") {
      const payment = event?.payload?.refund?.entity || {};
      return { gatewayOrderId: payment.order_id, gatewayPaymentId: payment.payment_id, status: "REFUNDED" };
    }
    return null;
  },

  async getPaymentStatus(cfg, { gatewayOrderId, gatewayPaymentId }) {
    if (gatewayPaymentId) {
      const payment = await razorpayRequest(cfg, "GET", `/payments/${gatewayPaymentId}`);
      const status = payment.status;
      if (status === "captured" || status === "authorized") return { status: "PAID", gatewayPaymentId: payment.id, gatewayOrderId: payment.order_id };
      if (status === "failed") return { status: "FAILED", gatewayPaymentId: payment.id, gatewayOrderId: payment.order_id };
      return { status: "PENDING", gatewayPaymentId: payment.id, gatewayOrderId: payment.order_id };
    }
    if (gatewayOrderId) {
      const order = await razorpayRequest(cfg, "GET", `/orders/${gatewayOrderId}`);
      if (order.status === "paid") return { status: "PAID", gatewayOrderId: order.id };
      if (order.status === "attempted") return { status: "PENDING", gatewayOrderId: order.id };
      return { status: "PENDING", gatewayOrderId: order.id };
    }
    return { status: "PENDING" };
  },
};
