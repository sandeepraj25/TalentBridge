import { query, queryOne, withTransaction } from "../db.js";
import { uuid, HttpError } from "../util.js";
import { activatePackage, notify, logAudit } from "../services.js";
import { getActiveGatewayOrThrow, getPaymentGatewayConfig } from "./settings.js";
import { getProvider } from "./gateway.js";
import { APPROVAL_STATUS, PAYMENT_STATUS, nextPaymentStatus, orderStatusForPayment, shouldAssignCoins } from "./logic.js";

function invoiceNo() {
  return `INV-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

async function applyCoupon(baseAmount, couponCode) {
  if (!couponCode) return { coupon: null, discount: 0, total: baseAmount };
  const coupon = await queryOne("SELECT * FROM coupons WHERE code = ? AND is_active = 1", [String(couponCode).toUpperCase()]);
  const valid =
    coupon &&
    (!coupon.valid_until || new Date(coupon.valid_until) > new Date()) &&
    (coupon.max_uses == null || coupon.used_count < coupon.max_uses);
  if (!valid) throw new HttpError(400, "Invalid or expired coupon");
  const discount =
    coupon.discount_type === "percent"
      ? Math.round((baseAmount * coupon.discount_value) / 100)
      : Math.min(baseAmount, Number(coupon.discount_value));
  return { coupon, discount, total: Math.max(0, baseAmount - discount) };
}

export async function createPlanPayment({ recruiter, planId, coupon }) {
  const pkg = await queryOne("SELECT * FROM packages WHERE id = ? AND is_active = 1", [planId]);
  if (!pkg) throw new HttpError(404, "Plan not found");

  const baseAmount = Number(pkg.price);
  const { coupon: appliedCoupon, discount, total } = await applyCoupon(baseAmount, coupon);
  const { gateway, cfg } = await getActiveGatewayOrThrow();
  const provider = getProvider(gateway);

  const orderId = uuid();
  const inv = invoiceNo();

  await query(
    `INSERT INTO orders (
       id, recruiter_id, kind, package_id, coins, amount, discount, coupon_code, status,
       gateway, currency, package_name, payment_status, approval_status, coins_to_assign, coins_assigned
     ) VALUES (?,?,?,?,?,?,?,?,'created',?,'INR',?,?,?,?,0)`,
    [
      orderId,
      recruiter.id,
      "package",
      pkg.id,
      pkg.coins,
      total,
      discount,
      appliedCoupon?.code || null,
      gateway,
      pkg.name,
      PAYMENT_STATUS.PENDING,
      null,
      pkg.coins,
    ]
  );

  await query(
    "INSERT INTO payments (id, order_id, amount, method, status, invoice_no) VALUES (?,?,?,?,'pending',?)",
    [uuid(), orderId, total, gateway, inv]
  );

  let created;
  try {
    created = await provider.createOrder({
      cfg,
      order: {
        id: orderId,
        amount: total,
        currency: "INR",
        package_id: pkg.id,
        package_name: pkg.name,
      },
      recruiter,
    });
  } catch (err) {
    await applyPaymentStatus(orderId, PAYMENT_STATUS.FAILED);
    throw err;
  }

  await query("UPDATE orders SET gateway_order_id=?, gateway_ref=? WHERE id=?", [
    created.gatewayOrderId,
    created.gatewayOrderId,
    orderId,
  ]);

  return {
    orderId,
    invoiceNo: inv,
    amount: total,
    currency: "INR",
    plan: { id: pkg.id, name: pkg.name },
    checkout: created.checkout,
  };
}

export async function findOrderByGatewayOrderId(gateway, gatewayOrderId) {
  if (!gatewayOrderId) return null;
  return queryOne("SELECT * FROM orders WHERE gateway=? AND gateway_order_id=?", [gateway, gatewayOrderId]);
}

export async function applyPaymentStatus(orderId, incomingStatus, extra = {}) {
  return withTransaction(async (conn) => {
    const [[order]] = await conn.execute("SELECT * FROM orders WHERE id = ? FOR UPDATE", [orderId]);
    if (!order) return null;
    const next = nextPaymentStatus(order.payment_status, incomingStatus);
    if (next === order.payment_status && !extra.gatewayPaymentId && !extra.gatewaySignature) {
      return order;
    }

    const approval =
      next === PAYMENT_STATUS.PAID
        ? order.approval_status || APPROVAL_STATUS.PENDING_APPROVAL
        : order.approval_status;

    await conn.execute(
      `UPDATE orders SET
         payment_status=?, status=?, approval_status=?,
         gateway_payment_id=COALESCE(?, gateway_payment_id),
         gateway_signature=COALESCE(?, gateway_signature)
       WHERE id=?`,
      [
        next,
        orderStatusForPayment(next),
        approval,
        extra.gatewayPaymentId || null,
        extra.gatewaySignature || null,
        orderId,
      ]
    );

    const payStatus = next === PAYMENT_STATUS.PAID ? "success" : next === PAYMENT_STATUS.PENDING ? "pending" : "failed";
    await conn.execute("UPDATE payments SET status=? WHERE order_id=?", [payStatus, orderId]);

    if (order.payment_status !== PAYMENT_STATUS.PAID && next === PAYMENT_STATUS.PAID && order.coupon_code) {
      await conn.execute("UPDATE coupons SET used_count = used_count + 1 WHERE code = ?", [order.coupon_code]);
    }

    return { ...order, payment_status: next, approval_status: approval, _becamePaid: order.payment_status !== PAYMENT_STATUS.PAID && next === PAYMENT_STATUS.PAID };
  });
}

export async function markPaidFromGateway({ order, gatewayPaymentId, gatewaySignature }) {
  const updated = await applyPaymentStatus(order.id, PAYMENT_STATUS.PAID, { gatewayPaymentId, gatewaySignature });
  if (updated?._becamePaid) {
    await notify(
      order.recruiter_id,
      "payment",
      "Payment successful",
      `${order.package_name || "Plan"} purchase is waiting for admin approval. Coins will be added after approval.`,
      "/dashboard/recruiter/packages"
    );
    const admins = await query("SELECT id FROM users WHERE role='admin' AND is_active=1");
    for (const admin of admins) {
      await notify(
        admin.id,
        "payment",
        "Plan purchase pending approval",
        `${order.package_name || "Plan"} · ₹${Number(order.amount).toLocaleString("en-IN")}`,
        "/dashboard/admin/approvals"
      );
    }
  }
  return updated;
}

export async function verifyRecruiterPayment({ recruiterId, orderId, payload }) {
  const order = await queryOne("SELECT * FROM orders WHERE id=? AND recruiter_id=?", [orderId, recruiterId]);
  if (!order) throw new HttpError(404, "Payment not found");
  if (order.kind !== "package") throw new HttpError(400, "Invalid payment");

  const cfg = await getPaymentGatewayConfig();
  const provider = getProvider(order.gateway);
  if (!provider) throw new HttpError(400, "Unknown payment gateway");

  if (order.gateway === "razorpay") {
    const ok = provider.verifyCheckoutSignature(cfg, payload || {});
    if (!ok) throw new HttpError(400, "Payment verification failed", "VERIFICATION_FAILED");
    const remote = await provider.getPaymentStatus(cfg, {
      gatewayOrderId: payload.razorpay_order_id || order.gateway_order_id,
      gatewayPaymentId: payload.razorpay_payment_id,
    });
    if (remote.status !== "PAID") throw new HttpError(400, "Payment is not complete yet", "VERIFICATION_FAILED");
    await markPaidFromGateway({
      order,
      gatewayPaymentId: payload.razorpay_payment_id,
      gatewaySignature: payload.razorpay_signature,
    });
  } else {
    const remote = await provider.getPaymentStatus(cfg, { gatewayOrderId: order.gateway_order_id || order.id });
    if (remote.status !== "PAID") {
      if (remote.status === "FAILED" || remote.status === "CANCELLED") {
        await applyPaymentStatus(order.id, remote.status);
      }
      throw new HttpError(400, "Payment is not complete yet", "VERIFICATION_FAILED");
    }
    await markPaidFromGateway({ order, gatewayPaymentId: remote.gatewayPaymentId });
  }

  const fresh = await queryOne("SELECT * FROM orders WHERE id=?", [orderId]);
  return {
    orderId: fresh.id,
    paymentStatus: fresh.payment_status,
    approvalStatus: fresh.approval_status,
    message: "Payment successful. Your purchase is waiting for admin approval.",
  };
}

export async function cancelRecruiterPayment({ recruiterId, orderId }) {
  const order = await queryOne("SELECT * FROM orders WHERE id=? AND recruiter_id=?", [orderId, recruiterId]);
  if (!order) throw new HttpError(404, "Payment not found");
  if (order.payment_status !== PAYMENT_STATUS.PENDING) {
    return { orderId: order.id, paymentStatus: order.payment_status };
  }
  await applyPaymentStatus(order.id, PAYMENT_STATUS.CANCELLED);
  return { orderId: order.id, paymentStatus: PAYMENT_STATUS.CANCELLED };
}

export async function handleWebhook(gateway, rawBody, headers) {
  const cfg = await getPaymentGatewayConfig();
  const provider = getProvider(gateway);
  if (!provider) throw new HttpError(400, "Unknown payment gateway");
  const event = provider.verifyWebhook(cfg, rawBody, headers);
  const parsed = provider.parseWebhookEvent(event);
  if (!parsed) return { ok: true, ignored: true };

  const order =
    (await findOrderByGatewayOrderId(gateway, parsed.gatewayOrderId)) ||
    (await queryOne("SELECT * FROM orders WHERE id=?", [parsed.gatewayOrderId]));
  if (!order) return { ok: true, ignored: true };

  if (parsed.status === PAYMENT_STATUS.PAID) {
    await markPaidFromGateway({
      order,
      gatewayPaymentId: parsed.gatewayPaymentId,
    });
  } else {
    await applyPaymentStatus(order.id, parsed.status, { gatewayPaymentId: parsed.gatewayPaymentId });
  }
  return { ok: true };
}

export async function approvePlanPayment({ adminId, orderId }) {
  return withTransaction(async (conn) => {
    const [[order]] = await conn.execute("SELECT * FROM orders WHERE id = ? FOR UPDATE", [orderId]);
    if (!order) throw new HttpError(404, "Payment not found");
    if (order.payment_status !== PAYMENT_STATUS.PAID) {
      throw new HttpError(400, "Only paid purchases can be approved");
    }
    if (order.approval_status === APPROVAL_STATUS.REJECTED) {
      throw new HttpError(400, "This purchase was rejected");
    }
    if (order.approval_status === APPROVAL_STATUS.APPROVED && order.coins_assigned) {
      return { alreadyApproved: true, coinsAssigned: true };
    }

    if (!shouldAssignCoins({
      paymentStatus: order.payment_status,
      approvalStatus: order.approval_status || APPROVAL_STATUS.PENDING_APPROVAL,
      coinsAssigned: order.coins_assigned,
    }) && order.approval_status === APPROVAL_STATUS.APPROVED) {
      return { alreadyApproved: true, coinsAssigned: Boolean(order.coins_assigned) };
    }

    const [result] = await conn.execute(
      `UPDATE orders SET approval_status=?, coins_assigned=1, approved_by=?, approved_at=NOW()
       WHERE id=? AND payment_status=? AND coins_assigned=0 AND (approval_status IS NULL OR approval_status=?)`,
      [APPROVAL_STATUS.APPROVED, adminId, orderId, PAYMENT_STATUS.PAID, APPROVAL_STATUS.PENDING_APPROVAL]
    );
    if (!result.affectedRows) {
      return { alreadyApproved: true, coinsAssigned: true };
    }

    if (order.package_id) {
      await activatePackage(order.recruiter_id, order.package_id, conn);
    }
    return { alreadyApproved: false, coinsAssigned: true };
  }).then(async (result) => {
    if (!result.alreadyApproved) {
      await logAudit(adminId, "payment.approve", "orders", orderId);
      const order = await queryOne("SELECT * FROM orders WHERE id=?", [orderId]);
      await notify(
        order.recruiter_id,
        "payment",
        "Purchase approved",
        `${order.package_name || "Plan"} is active. Coins have been added to your wallet.`,
        "/dashboard/recruiter/coins"
      );
    }
    return result;
  });
}

export async function rejectPlanPayment({ adminId, orderId }) {
  return withTransaction(async (conn) => {
    const [[order]] = await conn.execute("SELECT * FROM orders WHERE id = ? FOR UPDATE", [orderId]);
    if (!order) throw new HttpError(404, "Payment not found");
    if (order.payment_status !== PAYMENT_STATUS.PAID) {
      throw new HttpError(400, "Only paid purchases can be rejected");
    }
    if (order.approval_status === APPROVAL_STATUS.APPROVED) {
      throw new HttpError(400, "This purchase is already approved");
    }
    await conn.execute(
      `UPDATE orders SET approval_status=?, rejected_by=?, rejected_at=NOW() WHERE id=?`,
      [APPROVAL_STATUS.REJECTED, adminId, orderId]
    );
    return order;
  }).then(async (order) => {
    await logAudit(adminId, "payment.reject", "orders", orderId);
    await notify(
      order.recruiter_id,
      "payment",
      "Purchase not approved",
      `${order.package_name || "Plan"} purchase was not approved. No coins were added.`,
      "/dashboard/recruiter/packages"
    );
    return { ok: true };
  });
}

export function serializeOrder(order) {
  return {
    id: order.id,
    recruiter_id: order.recruiter_id,
    recruiter_name: order.recruiter_name || null,
    recruiter_email: order.recruiter_email || null,
    package_id: order.package_id,
    package_name: order.package_name,
    amount: Number(order.amount),
    currency: order.currency || "INR",
    gateway: order.gateway,
    gateway_order_id: order.gateway_order_id,
    gateway_payment_id: order.gateway_payment_id,
    payment_status: order.payment_status,
    approval_status: order.approval_status,
    coins: order.coins_to_assign ?? order.coins,
    coins_to_assign: order.coins_to_assign,
    coins_assigned: Boolean(order.coins_assigned),
    created_at: order.created_at,
  };
}
