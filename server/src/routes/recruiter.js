import { Router } from "express";
import { z } from "zod";
import { query, queryOne } from "../db.js";
import { uuid, HttpError, asyncHandler, parseJson, toList, uniqueSlug, JOB_CATEGORIES } from "../util.js";
import { authRequired, requireRole } from "../auth.js";
import { JOB_WITH_COMPANY, shapeJob, shapeCandidate } from "../shape.js";
import { notify, spendCoins, unlockCandidate, activatePackage, creditCoins, getOrCreateWallet } from "../services.js";

const router = Router();
router.use(authRequired, requireRole("recruiter"));
const me = (req) => req.user.id;

async function companyIdOf(recruiterId) {
  const r = await queryOne("SELECT company_id FROM recruiters WHERE id = ?", [recruiterId]);
  return r?.company_id ?? null;
}

// ---- Overview -------------------------------------------------------------
router.get("/overview", asyncHandler(async (req, res) => {
  const [activeRows, wallet, appRows, pkg] = await Promise.all([
    query("SELECT COUNT(*) AS n FROM jobs WHERE recruiter_id = ? AND status='active'", [me(req)]),
    getOrCreateWallet(me(req)),
    query("SELECT COUNT(*) AS n FROM applications a JOIN jobs j ON j.id=a.job_id WHERE j.recruiter_id = ?", [me(req)]),
    queryOne(`SELECT rp.*, p.name AS package_name FROM recruiter_packages rp JOIN packages p ON p.id = rp.package_id
              WHERE rp.recruiter_id = ? AND rp.status='active' ORDER BY rp.expires_at DESC LIMIT 1`, [me(req)]),
  ]);
  const recent = await query(
    `SELECT a.*, j.title AS job_title, u.full_name AS candidate_name FROM applications a
     JOIN jobs j ON j.id=a.job_id JOIN users u ON u.id=a.candidate_id
     WHERE j.recruiter_id = ? ORDER BY a.created_at DESC LIMIT 6`, [me(req)]);
  res.json({
    stats: { active_jobs: activeRows[0].n, applicants: appRows[0].n, coins: wallet.balance },
    active_package: pkg ? { name: pkg.package_name, remaining_unlocks: pkg.remaining_unlocks, remaining_job_posts: pkg.remaining_job_posts, expires_at: pkg.expires_at } : null,
    recent,
  });
}));

// ---- Company --------------------------------------------------------------
router.get("/company", asyncHandler(async (req, res) => {
  const r = await queryOne("SELECT company_id, designation FROM recruiters WHERE id = ?", [me(req)]);
  let company = null;
  if (r?.company_id) company = await queryOne("SELECT * FROM companies WHERE id = ?", [r.company_id]);
  res.json({ company: company ? { ...company, is_verified: !!company.is_verified } : null, designation: r?.designation ?? null });
}));

router.put("/company", asyncHandler(async (req, res) => {
  const b = req.body;
  if (!b.name) throw new HttpError(400, "Company name is required");
  const existingId = await companyIdOf(me(req));
  if (existingId) {
    await query("UPDATE companies SET name=?, logo_url=?, website=?, description=?, industry=?, company_size=?, location=? WHERE id=?",
      [b.name, b.logo_url || null, b.website || null, b.description || null, b.industry || null, b.company_size || null, b.location || null, existingId]);
  } else {
    const id = uuid();
    await query("INSERT INTO companies (id, name, slug, logo_url, website, description, industry, company_size, location, created_by) VALUES (?,?,?,?,?,?,?,?,?,?)",
      [id, b.name, uniqueSlug(b.name), b.logo_url || null, b.website || null, b.description || null, b.industry || null, b.company_size || null, b.location || null, me(req)]);
    await query("UPDATE recruiters SET company_id=?, designation=? WHERE id=?", [id, b.designation || null, me(req)]);
  }
  if (b.designation !== undefined) await query("UPDATE recruiters SET designation=? WHERE id=?", [b.designation || null, me(req)]);
  res.json({ ok: true });
}));

// ---- Jobs -----------------------------------------------------------------
router.get("/jobs", asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT j.*, (SELECT COUNT(*) FROM applications a WHERE a.job_id=j.id) AS application_count
     FROM jobs j WHERE j.recruiter_id = ? ORDER BY j.created_at DESC`, [me(req)]);
  res.json({ jobs: rows.map((j) => ({ ...j, skills: parseJson(j.skills, []), is_featured: !!j.is_featured, is_boosted: !!j.is_boosted })) });
}));

router.get("/jobs/:id", asyncHandler(async (req, res) => {
  const row = await queryOne("SELECT * FROM jobs WHERE id = ? AND recruiter_id = ?", [req.params.id, me(req)]);
  if (!row) throw new HttpError(404, "Job not found");
  res.json({ job: { ...row, skills: parseJson(row.skills, []) } });
}));

const jobSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional().default(""),
  responsibilities: z.string().optional().nullable(),
  requirements: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  job_type: z.string().default("full_time"),
  work_mode: z.string().default("onsite"),
  category: z.string().optional().nullable().transform((v) => (v && String(v).trim() ? String(v).trim() : null))
    .refine((v) => v == null || JOB_CATEGORIES.includes(v), { message: "Invalid job category" }),
  salary_min: z.coerce.number().optional().nullable(),
  salary_max: z.coerce.number().optional().nullable(),
  experience_min: z.coerce.number().optional().nullable(),
  experience_max: z.coerce.number().optional().nullable(),
  openings: z.coerce.number().optional().default(1),
  skills: z.any().optional(),
  status: z.enum(["draft", "active", "paused", "closed"]).default("active"),
});

router.post("/jobs", asyncHandler(async (req, res) => {
  const companyId = await companyIdOf(me(req));
  if (!companyId) throw new HttpError(400, "Create your company profile first");
  const d = jobSchema.parse(req.body);
  const id = uuid();
  await query(
    `INSERT INTO jobs (id, recruiter_id, company_id, title, slug, description, responsibilities, requirements, location,
      job_type, work_mode, category, salary_min, salary_max, experience_min, experience_max, skills, openings, status)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [id, me(req), companyId, d.title, uniqueSlug(d.title), d.description, d.responsibilities || null, d.requirements || null,
     d.location || null, d.job_type, d.work_mode, d.category ?? null, d.salary_min ?? null, d.salary_max ?? null, d.experience_min ?? null,
     d.experience_max ?? null, JSON.stringify(toList(d.skills)), d.openings || 1, d.status]
  );
  res.status(201).json({ id });
}));

router.put("/jobs/:id", asyncHandler(async (req, res) => {
  const d = jobSchema.parse(req.body);
  const result = await query(
    `UPDATE jobs SET title=?, description=?, responsibilities=?, requirements=?, location=?, job_type=?, work_mode=?,
      category=?, salary_min=?, salary_max=?, experience_min=?, experience_max=?, skills=?, openings=?, status=? WHERE id=? AND recruiter_id=?`,
    [d.title, d.description, d.responsibilities || null, d.requirements || null, d.location || null, d.job_type, d.work_mode,
     d.category ?? null, d.salary_min ?? null, d.salary_max ?? null, d.experience_min ?? null, d.experience_max ?? null,
     JSON.stringify(toList(d.skills)), d.openings || 1, d.status, req.params.id, me(req)]
  );
  res.json({ ok: true });
}));

router.patch("/jobs/:id/status", asyncHandler(async (req, res) => {
  await query("UPDATE jobs SET status=? WHERE id=? AND recruiter_id=?", [req.body.status, req.params.id, me(req)]);
  res.json({ ok: true });
}));

router.delete("/jobs/:id", asyncHandler(async (req, res) => {
  await query("DELETE FROM jobs WHERE id=? AND recruiter_id=?", [req.params.id, me(req)]);
  res.json({ ok: true });
}));

router.post("/jobs/:id/promote", asyncHandler(async (req, res) => {
  const kind = req.body.kind === "feature" ? "feature" : "boost";
  const job = await queryOne("SELECT id FROM jobs WHERE id=? AND recruiter_id=?", [req.params.id, me(req)]);
  if (!job) throw new HttpError(404, "Job not found");
  await spendCoins(me(req), kind === "feature" ? "feature_job" : "boost_job", req.params.id);
  if (kind === "feature") await query("UPDATE jobs SET is_featured=1 WHERE id=?", [req.params.id]);
  else await query("UPDATE jobs SET is_boosted=1, boosted_until=DATE_ADD(NOW(), INTERVAL 7 DAY) WHERE id=?", [req.params.id]);
  res.json({ ok: true });
}));

// ---- Applications ---------------------------------------------------------
router.get("/applications", asyncHandler(async (req, res) => {
  const params = [me(req)];
  let jobFilter = "";
  if (req.query.job) { jobFilter = "AND a.job_id = ?"; params.push(req.query.job); }
  const rows = await query(
    `SELECT a.*, j.title AS job_title, u.full_name AS candidate_name, u.avatar_url AS candidate_avatar,
       c.headline AS candidate_headline
     FROM applications a JOIN jobs j ON j.id=a.job_id
     JOIN users u ON u.id=a.candidate_id LEFT JOIN candidates c ON c.id=a.candidate_id
     WHERE j.recruiter_id = ? ${jobFilter} ORDER BY a.created_at DESC`, params);
  res.json({ applications: rows });
}));

router.patch("/applications/:id/status", asyncHandler(async (req, res) => {
  const status = req.body.status;
  const app = await queryOne(
    `SELECT a.id, a.candidate_id, j.title FROM applications a JOIN jobs j ON j.id=a.job_id
     WHERE a.id=? AND j.recruiter_id=?`, [req.params.id, me(req)]);
  if (!app) throw new HttpError(404, "Application not found");
  await query("UPDATE applications SET status=? WHERE id=?", [status, req.params.id]);
  await notify(app.candidate_id, "status", `Application update: ${app.title}`, `Your application is now "${status}".`, "/dashboard/candidate/applications");
  res.json({ ok: true });
}));

// ---- Candidate search & profile -------------------------------------------
router.get("/candidates", asyncHandler(async (req, res) => {
  const { q, location, skill, experience } = req.query;
  const where = ["c.open_to_work = 1"];
  const params = [];
  if (q) { where.push("(c.headline LIKE ? OR c.about LIKE ? OR u.full_name LIKE ?)"); params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  if (location) { where.push("c.location LIKE ?"); params.push(`%${location}%`); }
  if (skill) { where.push("JSON_CONTAINS(c.skills, JSON_QUOTE(?))"); params.push(skill); }
  if (experience) { where.push("c.experience_years >= ?"); params.push(Number(experience)); }

  const rows = await query(
    `SELECT c.id, c.headline, c.about, c.location, c.experience_years, c.expected_salary, c.skills, c.resume_url,
       u.full_name, u.avatar_url
     FROM candidates c JOIN users u ON u.id = c.id
     WHERE ${where.join(" AND ")} ORDER BY c.updated_at DESC LIMIT 60`, params);

  const unlocks = await query("SELECT candidate_id FROM candidate_unlocks WHERE recruiter_id = ?", [me(req)]);
  const unlockedSet = new Set(unlocks.map((u) => u.candidate_id));
  res.json({ candidates: rows.map((c) => ({ ...shapeCandidate(c), unlocked: unlockedSet.has(c.id) })) });
}));

router.get("/candidates/:id", asyncHandler(async (req, res) => {
  const id = req.params.id;
  const c = await queryOne(
    `SELECT c.*, u.full_name, u.avatar_url FROM candidates c JOIN users u ON u.id=c.id WHERE c.id = ?`, [id]);
  if (!c) throw new HttpError(404, "Candidate not found");
  const [edu, exp, proj, unlock, note] = await Promise.all([
    query("SELECT * FROM educations WHERE candidate_id = ?", [id]),
    query("SELECT * FROM experiences WHERE candidate_id = ? ORDER BY start_date DESC", [id]),
    query("SELECT * FROM projects WHERE candidate_id = ?", [id]),
    queryOne("SELECT id FROM candidate_unlocks WHERE recruiter_id=? AND candidate_id=?", [me(req), id]),
    queryOne("SELECT * FROM candidate_notes WHERE recruiter_id=? AND candidate_id=?", [me(req), id]),
  ]);
  let contact = null;
  if (unlock) {
    const u = await queryOne("SELECT email, phone FROM users WHERE id = ?", [id]);
    contact = u;
  }
  res.json({
    candidate: shapeCandidate(c),
    educations: edu,
    experiences: exp.map((e) => ({ ...e, is_current: !!e.is_current })),
    projects: proj.map((p) => ({ ...p, tech: parseJson(p.tech, []) })),
    unlocked: !!unlock,
    contact,
    note: note ? { ...note, tags: parseJson(note.tags, []) } : null,
  });
}));

router.post("/candidates/:id/unlock", asyncHandler(async (req, res) => {
  await unlockCandidate(me(req), req.params.id);
  const contact = await queryOne("SELECT email, phone FROM users WHERE id = ?", [req.params.id]);
  res.json({ ok: true, contact });
}));

router.post("/candidates/:id/note", asyncHandler(async (req, res) => {
  const tags = JSON.stringify(toList(req.body.tags));
  await query(
    `INSERT INTO candidate_notes (id, recruiter_id, candidate_id, note, tags) VALUES (?,?,?,?,?)
     ON DUPLICATE KEY UPDATE note=VALUES(note), tags=VALUES(tags)`,
    [uuid(), me(req), req.params.id, req.body.note || null, tags]);
  res.json({ ok: true });
}));

// ---- Interviews -----------------------------------------------------------
router.get("/interviews", asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT iv.*, j.title AS job_title, u.full_name AS candidate_name FROM interviews iv
     JOIN applications a ON a.id=iv.application_id JOIN jobs j ON j.id=a.job_id JOIN users u ON u.id=a.candidate_id
     WHERE j.recruiter_id = ? ORDER BY iv.scheduled_at ASC`, [me(req)]);
  res.json({ interviews: rows });
}));

router.post("/interviews", asyncHandler(async (req, res) => {
  const b = req.body;
  const app = await queryOne(
    `SELECT a.id, a.candidate_id, j.title FROM applications a JOIN jobs j ON j.id=a.job_id
     WHERE a.id=? AND j.recruiter_id=?`, [b.application_id, me(req)]);
  if (!app) throw new HttpError(404, "Application not found");
  await query("INSERT INTO interviews (id, application_id, scheduled_at, mode, location, meeting_link, notes) VALUES (?,?,?,?,?,?,?)",
    [uuid(), b.application_id, new Date(b.scheduled_at), b.mode || "video", b.location || null, b.meeting_link || null, b.notes || null]);
  await query("UPDATE applications SET status='interview' WHERE id=?", [b.application_id]);
  await notify(app.candidate_id, "interview", "You have an interview scheduled", `For ${app.title}.`, "/dashboard/candidate/interviews");
  res.status(201).json({ ok: true });
}));

// ---- Coins ----------------------------------------------------------------
router.get("/coins", asyncHandler(async (req, res) => {
  const wallet = await getOrCreateWallet(me(req));
  const txns = await query("SELECT * FROM coin_transactions WHERE wallet_id = ? ORDER BY created_at DESC LIMIT 50", [wallet.id]);
  res.json({ balance: wallet.balance, transactions: txns });
}));

// ---- Packages -------------------------------------------------------------
router.get("/packages", asyncHandler(async (req, res) => {
  const packages = await query("SELECT * FROM packages WHERE is_active=1 ORDER BY sort_order");
  const active = await queryOne(
    `SELECT rp.*, p.name AS package_name FROM recruiter_packages rp JOIN packages p ON p.id=rp.package_id
     WHERE rp.recruiter_id=? AND rp.status='active' ORDER BY rp.expires_at DESC LIMIT 1`, [me(req)]);
  res.json({
    packages: packages.map((p) => ({ ...p, features: parseJson(p.features, []) })),
    active: active ? { ...active, package: { name: active.package_name } } : null,
  });
}));

// ---- Checkout (mock gateway) ----------------------------------------------
router.post("/checkout", asyncHandler(async (req, res) => {
  const b = req.body;
  const kind = b.kind === "coins" ? "coins" : "package";
  let baseAmount = 0, packageId = null, coins = null;

  if (kind === "package") {
    packageId = b.package_id;
    const pkg = await queryOne("SELECT price FROM packages WHERE id = ?", [packageId]);
    if (!pkg) throw new HttpError(404, "Package not found");
    baseAmount = Number(pkg.price);
  } else {
    coins = Number(b.coins);
    baseAmount = Number(b.amount);
  }

  let coupon = null, discount = 0;
  if (b.coupon) {
    coupon = await queryOne("SELECT * FROM coupons WHERE code = ? AND is_active = 1", [String(b.coupon).toUpperCase()]);
    const valid = coupon && (!coupon.valid_until || new Date(coupon.valid_until) > new Date()) && (coupon.max_uses == null || coupon.used_count < coupon.max_uses);
    if (!valid) throw new HttpError(400, "Invalid or expired coupon");
    discount = coupon.discount_type === "percent" ? Math.round((baseAmount * coupon.discount_value) / 100) : Math.min(baseAmount, Number(coupon.discount_value));
  }
  const total = Math.max(0, baseAmount - discount);

  const orderId = uuid();
  await query("INSERT INTO orders (id, recruiter_id, kind, package_id, coins, amount, discount, coupon_code, status) VALUES (?,?,?,?,?,?,?,?,'created')",
    [orderId, me(req), kind, packageId, coins, total, discount, coupon?.code || null]);

  // --- Mock payment success (swap for a real gateway verification) ---
  const invoiceNo = `INV-${Date.now().toString(36).toUpperCase()}`;
  await query("INSERT INTO payments (id, order_id, amount, method, status, invoice_no) VALUES (?,?,?,?,'success',?)",
    [uuid(), orderId, total, b.method || "upi", invoiceNo]);
  await query("UPDATE orders SET status='paid', gateway_ref=? WHERE id=?", [invoiceNo, orderId]);
  if (coupon) await query("UPDATE coupons SET used_count = used_count + 1 WHERE id = ?", [coupon.id]);

  if (kind === "package") await activatePackage(me(req), packageId);
  else await creditCoins(me(req), coins, "purchase", `Bought ${coins} coins`, orderId);

  await notify(me(req), "payment", "Payment successful", `Invoice ${invoiceNo} · ₹${total.toLocaleString("en-IN")}`, "/dashboard/recruiter/coins");
  res.json({ ok: true, invoice_no: invoiceNo });
}));

// ---- Analytics ------------------------------------------------------------
router.get("/analytics", asyncHandler(async (req, res) => {
  const jobs = await query("SELECT id, title, views, status FROM jobs WHERE recruiter_id = ?", [me(req)]);
  const apps = await query(
    `SELECT a.job_id, a.status FROM applications a JOIN jobs j ON j.id=a.job_id WHERE j.recruiter_id = ?`, [me(req)]);
  res.json({ jobs, applications: apps, total_views: jobs.reduce((s, j) => s + (j.views || 0), 0) });
}));

export default router;
