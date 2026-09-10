import { Router } from "express";
import { query } from "../db.js";
import { asyncHandler } from "../util.js";
import { authRequired } from "../auth.js";

const router = Router();
router.use(authRequired);
const me = (req) => req.user.id;

router.get("/", asyncHandler(async (req, res) => {
  const rows = await query("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 100", [me(req)]);
  res.json({ notifications: rows.map((n) => ({ ...n, is_read: !!n.is_read })) });
}));

router.get("/unread-count", asyncHandler(async (req, res) => {
  const rows = await query("SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND is_read = 0", [me(req)]);
  res.json({ count: rows[0].n });
}));

router.patch("/:id/read", asyncHandler(async (req, res) => {
  await query("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?", [req.params.id, me(req)]);
  res.json({ ok: true });
}));

router.post("/read-all", asyncHandler(async (req, res) => {
  await query("UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0", [me(req)]);
  res.json({ ok: true });
}));

export default router;
