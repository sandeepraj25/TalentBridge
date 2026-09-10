import { Router } from "express";
import { query, queryOne } from "../db.js";
import { uuid, asyncHandler, parseJson, toList, uniqueSlug } from "../util.js";
import { authRequired, requireRole } from "../auth.js";
import { logAudit, creditCoins } from "../services.js";

const router = Router();
router.use(authRequired, requireRole("admin"));
const n = (rows) => rows[0].n;

// ---- Overview -------------------------------------------------------------
router.get("/overview", asyncHandler(async (_req, res) => {
  const [cand, rec, comp, jobs, apps, pj, pc, reports, pay] = await Promise.all([
    query("SELECT COUNT(*) AS n FROM users WHERE role='candidate'"),
    query("SELECT COUNT(*) AS n FROM users WHERE role='recruiter'"),
    query("SELECT COUNT(*) AS n FROM companies"),
    query("SELECT COUNT(*) AS n FROM jobs"),
    query("SELECT COUNT(*) AS n FROM applications"),
    query("SELECT COUNT(*) AS n FROM jobs WHERE approval_status='pending'"),
    query("SELECT COUNT(*) AS n FROM companies WHERE verification_status='pending'"),
    query("SELECT COUNT(*) AS n FROM reports WHERE status='open'"),
    query("SELECT COALESCE(SUM(amount),0) AS n FROM payments WHERE status='success'"),
  ]);
  res.json({
    candidates: n(cand), recruiters: n(rec), companies: n(comp), jobs: n(jobs), applications: n(apps),
    pending_approvals: n(pj) + n(pc), open_reports: n(reports), revenue: Number(n(pay)),
  });
}));

// ---- Users ----------------------------------------------------------------
router.get("/users", asyncHandler(async (req, res) => {
  const params = [];
  let filter = "";
  if (req.query.role) { filter = "WHERE role = ?"; params.push(req.query.role); }
  const rows = await query(
    `SELECT id, email, role, full_name, phone, avatar_url, is_active, created_at FROM users ${filter} ORDER BY created_at DESC LIMIT 200`, params);
  res.json({ users: rows.map((u) => ({ ...u, is_active: !!u.is_active })) });
}));

router.patch("/users/:id/active", asyncHandler(async (req, res) => {
  const active = req.body.active ? 1 : 0;
  await query("UPDATE users SET is_active = ? WHERE id = ?", [active, req.params.id]);
  await logAudit(req.user.id, active ? "user.activate" : "user.suspend", "users", req.params.id);
  res.json({ ok: true });
}));

router.post("/users/:id/grant-coins", asyncHandler(async (req, res) => {
  const amount = Number(req.body.amount);
  if (amount) await creditCoins(req.params.id, amount, "bonus", "Admin grant");
  await logAudit(req.user.id, "coins.grant", "users", req.params.id, { amount });
  res.json({ ok: true });
}));

// ---- Companies ------------------------------------------------------------
router.get("/companies", asyncHandler(async (_req, res) => {
  const rows = await query("SELECT * FROM companies ORDER BY created_at DESC");
  res.json({ companies: rows.map((c) => ({ ...c, is_verified: !!c.is_verified })) });
}));

router.patch("/companies/:id/verification", asyncHandler(async (req, res) => {
  const status = req.body.status;
  await query("UPDATE companies SET verification_status=?, is_verified=? WHERE id=?", [status, status === "approved" ? 1 : 0, req.params.id]);
  await logAudit(req.user.id, `company.${status}`, "companies", req.params.id);
  res.json({ ok: true });
}));

// ---- Jobs -----------------------------------------------------------------
router.get("/jobs", asyncHandler(async (_req, res) => {
  const rows = await query(
    `SELECT j.*, c.name AS company_name FROM jobs j JOIN companies c ON c.id=j.company_id ORDER BY j.created_at DESC LIMIT 200`);
  res.json({ jobs: rows.map((j) => ({ ...j, is_featured: !!j.is_featured, is_boosted: !!j.is_boosted })) });
}));

router.patch("/jobs/:id/approval", asyncHandler(async (req, res) => {
  await query("UPDATE jobs SET approval_status=? WHERE id=?", [req.body.status, req.params.id]);
  await logAudit(req.user.id, `job.${req.body.status}`, "jobs", req.params.id);
  res.json({ ok: true });
}));

router.patch("/jobs/:id/remove", asyncHandler(async (req, res) => {
  await query("UPDATE jobs SET status='closed' WHERE id=?", [req.params.id]);
  await logAudit(req.user.id, "job.remove", "jobs", req.params.id);
  res.json({ ok: true });
}));

// ---- Approvals ------------------------------------------------------------
router.get("/approvals", asyncHandler(async (_req, res) => {
  const [jobs, companies] = await Promise.all([
    query(`SELECT j.id, j.title, j.created_at, c.name AS company_name FROM jobs j JOIN companies c ON c.id=j.company_id WHERE j.approval_status='pending' ORDER BY j.created_at`),
    query("SELECT id, name, slug, industry, created_at FROM companies WHERE verification_status='pending' ORDER BY created_at"),
  ]);
  res.json({ jobs, companies });
}));

// ---- Packages -------------------------------------------------------------
router.get("/packages", asyncHandler(async (_req, res) => {
  const rows = await query("SELECT * FROM packages ORDER BY sort_order");
  res.json({ packages: rows.map((p) => ({ ...p, features: parseJson(p.features, []), is_active: !!p.is_active })) });
}));

router.post("/packages", asyncHandler(async (req, res) => {
  const b = req.body;
  const id = uuid();
  await query(
    `INSERT INTO packages (id, name, tier, price, coins, job_posts, candidate_unlocks, validity_days, features, is_active, sort_order)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [id, b.name, b.tier || "custom", b.price || 0, b.coins || 0, b.job_posts || 0, b.candidate_unlocks || 0,
     b.validity_days || 30, JSON.stringify(toList(b.features)), b.is_active ? 1 : 0, b.sort_order || 0]);
  res.status(201).json({ id });
}));

router.put("/packages/:id", asyncHandler(async (req, res) => {
  const b = req.body;
  await query(
    `UPDATE packages SET name=?, tier=?, price=?, coins=?, job_posts=?, candidate_unlocks=?, validity_days=?, features=?, is_active=?, sort_order=? WHERE id=?`,
    [b.name, b.tier || "custom", b.price || 0, b.coins || 0, b.job_posts || 0, b.candidate_unlocks || 0,
     b.validity_days || 30, JSON.stringify(toList(b.features)), b.is_active ? 1 : 0, b.sort_order || 0, req.params.id]);
  res.json({ ok: true });
}));

router.delete("/packages/:id", asyncHandler(async (req, res) => {
  await query("UPDATE packages SET is_active=0 WHERE id=?", [req.params.id]);
  res.json({ ok: true });
}));

// ---- Coin rules -----------------------------------------------------------
router.get("/coin-rules", asyncHandler(async (_req, res) => {
  const rules = await query("SELECT * FROM coin_rules ORDER BY cost");
  const stats = await query("SELECT type, amount FROM coin_transactions");
  const issued = stats.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const spent = stats.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  res.json({ rules, issued, spent });
}));

router.patch("/coin-rules/:action", asyncHandler(async (req, res) => {
  await query("UPDATE coin_rules SET cost=? WHERE action=?", [Number(req.body.cost), req.params.action]);
  res.json({ ok: true });
}));

// ---- Payments -------------------------------------------------------------
router.get("/payments", asyncHandler(async (_req, res) => {
  const rows = await query(
    `SELECT p.*, o.kind, o.coins, o.coupon_code, pk.name AS package_name FROM payments p
     JOIN orders o ON o.id=p.order_id LEFT JOIN packages pk ON pk.id=o.package_id
     ORDER BY p.created_at DESC LIMIT 200`);
  const total = rows.filter((p) => p.status === "success").reduce((s, p) => s + Number(p.amount), 0);
  res.json({ payments: rows, total });
}));

// ---- Coupons --------------------------------------------------------------
router.get("/coupons", asyncHandler(async (_req, res) => {
  const rows = await query("SELECT * FROM coupons ORDER BY code");
  res.json({ coupons: rows.map((c) => ({ ...c, is_active: !!c.is_active })) });
}));

router.post("/coupons", asyncHandler(async (req, res) => {
  const b = req.body;
  await query(
    `INSERT INTO coupons (id, code, discount_type, discount_value, max_uses, valid_until, is_active)
     VALUES (?,?,?,?,?,?,1) ON DUPLICATE KEY UPDATE discount_type=VALUES(discount_type), discount_value=VALUES(discount_value), max_uses=VALUES(max_uses), valid_until=VALUES(valid_until), is_active=1`,
    [uuid(), String(b.code).toUpperCase(), b.discount_type || "percent", b.discount_value || 0, b.max_uses || null, b.valid_until || null]);
  res.status(201).json({ ok: true });
}));

router.patch("/coupons/:id/toggle", asyncHandler(async (req, res) => {
  await query("UPDATE coupons SET is_active=? WHERE id=?", [req.body.active ? 1 : 0, req.params.id]);
  res.json({ ok: true });
}));

// ---- Reports --------------------------------------------------------------
router.get("/reports", asyncHandler(async (_req, res) => {
  res.json({ reports: await query("SELECT * FROM reports ORDER BY created_at DESC") });
}));

router.patch("/reports/:id", asyncHandler(async (req, res) => {
  await query("UPDATE reports SET status=? WHERE id=?", [req.body.status, req.params.id]);
  res.json({ ok: true });
}));

// ---- CMS ------------------------------------------------------------------
router.get("/cms", asyncHandler(async (_req, res) => {
  res.json({ content: await query("SELECT * FROM cms_content ORDER BY `key`") });
}));

router.put("/cms/:key", asyncHandler(async (req, res) => {
  await query(
    "INSERT INTO cms_content (`key`, title, body) VALUES (?,?,?) ON DUPLICATE KEY UPDATE title=VALUES(title), body=VALUES(body)",
    [req.params.key, req.body.title || null, req.body.body || null]);
  res.json({ ok: true });
}));

// ---- Settings -------------------------------------------------------------
router.get("/settings", asyncHandler(async (_req, res) => {
  const row = await queryOne("SELECT value FROM settings WHERE `key`='general'");
  res.json({ settings: parseJson(row?.value, {}) });
}));

router.put("/settings", asyncHandler(async (req, res) => {
  await query(
    "INSERT INTO settings (`key`, value) VALUES ('general', ?) ON DUPLICATE KEY UPDATE value=VALUES(value)",
    [JSON.stringify(req.body || {})]);
  res.json({ ok: true });
}));

// ---- Analytics ------------------------------------------------------------
router.get("/analytics", asyncHandler(async (_req, res) => {
  const [jobs, [users], pay] = await Promise.all([
    query("SELECT job_type, work_mode, status FROM jobs"),
    query("SELECT COUNT(*) AS n FROM users"),
    query("SELECT amount, status FROM payments"),
  ]);
  const apps = await query("SELECT COUNT(*) AS n FROM applications");
  const revenue = pay.filter((p) => p.status === "success").reduce((s, p) => s + Number(p.amount), 0);
  res.json({ jobs, users: users.n, applications: apps[0].n, revenue });
}));

// ---- Audit ----------------------------------------------------------------
router.get("/audit", asyncHandler(async (_req, res) => {
  const rows = await query("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 200");
  res.json({ logs: rows.map((l) => ({ ...l, meta: parseJson(l.meta, null) })) });
}));

export default router;
