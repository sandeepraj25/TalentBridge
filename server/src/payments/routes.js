import { Router } from "express";
import { z } from "zod";
import { query } from "../db.js";
import { asyncHandler, HttpError } from "../util.js";
import { authRequired, requireRole } from "../auth.js";
import {
  createPlanPayment,
  verifyRecruiterPayment,
  cancelRecruiterPayment,
  handleWebhook,
  serializeOrder,
} from "./service.js";

export const paymentWebhookRouter = Router();

paymentWebhookRouter.post(
  "/razorpay",
  asyncHandler(async (req, res) => {
    const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}));
    await handleWebhook("razorpay", raw, req.headers);
    res.json({ ok: true });
  })
);

paymentWebhookRouter.post(
  "/cashfree",
  asyncHandler(async (req, res) => {
    const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}));
    await handleWebhook("cashfree", raw, req.headers);
    res.json({ ok: true });
  })
);

export const paymentRouter = Router();

paymentRouter.post(
  "/create",
  authRequired,
  requireRole("recruiter"),
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        planId: z.string().min(1).optional(),
        package_id: z.string().min(1).optional(),
        coupon: z.string().optional(),
      })
      .parse(req.body || {});
    const planId = body.planId || body.package_id;
    if (!planId) throw new HttpError(400, "Plan is required");
    const result = await createPlanPayment({
      recruiter: req.user,
      planId,
      coupon: body.coupon,
    });
    res.json(result);
  })
);

paymentRouter.post(
  "/verify",
  authRequired,
  requireRole("recruiter"),
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        orderId: z.string().min(1),
        razorpay_order_id: z.string().optional(),
        razorpay_payment_id: z.string().optional(),
        razorpay_signature: z.string().optional(),
      })
      .parse(req.body || {});
    const result = await verifyRecruiterPayment({
      recruiterId: req.user.id,
      orderId: body.orderId,
      payload: body,
    });
    res.json(result);
  })
);

paymentRouter.post(
  "/cancel",
  authRequired,
  requireRole("recruiter"),
  asyncHandler(async (req, res) => {
    const body = z.object({ orderId: z.string().min(1) }).parse(req.body || {});
    const result = await cancelRecruiterPayment({ recruiterId: req.user.id, orderId: body.orderId });
    res.json(result);
  })
);

paymentRouter.get(
  "/history",
  authRequired,
  requireRole("recruiter"),
  asyncHandler(async (req, res) => {
    const rows = await query(
      `SELECT * FROM orders WHERE recruiter_id=? AND kind='package' ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );
    res.json({ orders: rows.map(serializeOrder) });
  })
);
