export const GATEWAYS = ["razorpay", "cashfree"];

export const PAYMENT_STATUS = {
  PENDING: "PENDING",
  PAID: "PAID",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED",
};

export const APPROVAL_STATUS = {
  PENDING_APPROVAL: "PENDING_APPROVAL",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
};

export function normalizeActiveGateway(value) {
  const v = String(value || "").toLowerCase().trim();
  if (!GATEWAYS.includes(v)) {
    const err = new Error("Active gateway must be razorpay or cashfree");
    err.code = "INVALID_GATEWAY";
    throw err;
  }
  return v;
}

export function rupeesToPaise(rupees) {
  const n = Number(rupees);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

const RANK = {
  [PAYMENT_STATUS.PENDING]: 0,
  [PAYMENT_STATUS.CANCELLED]: 1,
  [PAYMENT_STATUS.FAILED]: 1,
  [PAYMENT_STATUS.PAID]: 2,
  [PAYMENT_STATUS.REFUNDED]: 3,
};

/** Idempotent status transition. Never overwrite a terminal paid record with pending/failed. */
export function nextPaymentStatus(current, incoming) {
  const from = current || PAYMENT_STATUS.PENDING;
  const to = incoming;
  if (from === to) return from;
  if (from === PAYMENT_STATUS.PAID && to !== PAYMENT_STATUS.REFUNDED) return from;
  if (from === PAYMENT_STATUS.REFUNDED) return from;
  if ((RANK[to] ?? -1) < (RANK[from] ?? -1)) return from;
  return to;
}

export function orderStatusForPayment(paymentStatus) {
  if (paymentStatus === PAYMENT_STATUS.PAID) return "paid";
  if (paymentStatus === PAYMENT_STATUS.REFUNDED) return "refunded";
  if (paymentStatus === PAYMENT_STATUS.FAILED || paymentStatus === PAYMENT_STATUS.CANCELLED) return "failed";
  return "created";
}

export function shouldAssignCoins({ paymentStatus, approvalStatus, coinsAssigned }) {
  return (
    paymentStatus === PAYMENT_STATUS.PAID &&
    approvalStatus === APPROVAL_STATUS.APPROVED &&
    !coinsAssigned
  );
}

export function maskSecret(value) {
  const s = String(value || "");
  if (!s) return "";
  if (s.length <= 4) return "****";
  return `${"*".repeat(Math.max(4, s.length - 4))}${s.slice(-4)}`;
}
