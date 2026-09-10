import { Router } from "express";
import { query, queryOne } from "../db.js";
import { asyncHandler, parseJson, JOB_CATEGORIES } from "../util.js";
import { JOB_WITH_COMPANY, shapeJob } from "../shape.js";

const router = Router();

// ---- Job category counts (must be registered before /jobs/:id) ------------
router.get(
  "/jobs/categories",
  asyncHandler(async (_req, res) => {
    const rows = await query(
      `SELECT category, COUNT(*) AS n FROM jobs
       WHERE status = 'active' AND approval_status = 'approved' AND category IS NOT NULL AND category != ''
       GROUP BY category`
    );
    const counts = Object.fromEntries(rows.map((r) => [r.category, Number(r.n)]));
    res.json({
      categories: JOB_CATEGORIES.map((name) => ({ name, count: counts[name] ?? 0 })),
    });
  })
);

// ---- Jobs listing with filters --------------------------------------------
router.get(
  "/jobs",
  asyncHandler(async (req, res) => {
    const { q, location, job_type, work_mode, category, min_salary, min_experience, featured, sort, limit } = req.query;
    const where = ["j.status = 'active'", "j.approval_status = 'approved'"];
    const params = [];

    if (q) { where.push("j.title LIKE ?"); params.push(`%${q}%`); }
    if (location) { where.push("j.location LIKE ?"); params.push(`%${location}%`); }
    if (job_type) { where.push("j.job_type = ?"); params.push(job_type); }
    if (work_mode) { where.push("j.work_mode = ?"); params.push(work_mode); }
    if (category) { where.push("j.category = ?"); params.push(category); }
    if (min_salary) { where.push("j.salary_max >= ?"); params.push(Number(min_salary)); }
    if (min_experience !== undefined && min_experience !== "") { where.push("j.experience_min <= ?"); params.push(Number(min_experience)); }
    if (featured === "true") where.push("j.is_featured = 1");

    const order = sort === "salary" ? "j.salary_max DESC" : "j.is_boosted DESC, j.created_at DESC";
    const lim = Math.min(Number(limit) || 50, 100);

    const rows = await query(`${JOB_WITH_COMPANY} WHERE ${where.join(" AND ")} ORDER BY ${order} LIMIT ${lim}`, params);
    res.json({ jobs: rows.map(shapeJob) });
  })
);

// ---- Single job (increments views) ----------------------------------------
router.get(
  "/jobs/:id",
  asyncHandler(async (req, res) => {
    const row = await queryOne(`${JOB_WITH_COMPANY} WHERE j.id = ?`, [req.params.id]);
    if (!row) return res.status(404).json({ error: "Job not found" });
    if (row.status === "active" && row.approval_status === "approved") {
      await query("UPDATE jobs SET views = views + 1 WHERE id = ?", [req.params.id]);
    }
    res.json({ job: shapeJob(row) });
  })
);

// ---- Companies ------------------------------------------------------------
router.get(
  "/companies",
  asyncHandler(async (_req, res) => {
    const rows = await query(
      `SELECT c.*, (SELECT COUNT(*) FROM jobs j WHERE j.company_id = c.id AND j.status='active' AND j.approval_status='approved') AS open_jobs
       FROM companies c ORDER BY c.is_verified DESC, c.name`
    );
    res.json({ companies: rows.map((c) => ({ ...c, is_verified: !!c.is_verified })) });
  })
);

router.get(
  "/companies/:slug",
  asyncHandler(async (req, res) => {
    const company = await queryOne("SELECT * FROM companies WHERE slug = ?", [req.params.slug]);
    if (!company) return res.status(404).json({ error: "Company not found" });
    const jobs = await query(
      `${JOB_WITH_COMPANY} WHERE j.company_id = ? AND j.status='active' AND j.approval_status='approved' ORDER BY j.created_at DESC`,
      [company.id]
    );
    res.json({ company: { ...company, is_verified: !!company.is_verified }, jobs: jobs.map(shapeJob) });
  })
);

// ---- Packages (public pricing) --------------------------------------------
router.get(
  "/packages",
  asyncHandler(async (_req, res) => {
    const rows = await query("SELECT * FROM packages WHERE is_active = 1 ORDER BY sort_order");
    res.json({ packages: rows.map((p) => ({ ...p, features: parseJson(p.features, []), is_active: !!p.is_active })) });
  })
);

// ---- CMS content ----------------------------------------------------------
router.get(
  "/content/:key",
  asyncHandler(async (req, res) => {
    const row = await queryOne("SELECT * FROM cms_content WHERE `key` = ?", [req.params.key]);
    res.json({ content: row ?? null });
  })
);

// ---- Public stats (landing) -----------------------------------------------
router.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    const [[jobs], [companies], [candidates]] = await Promise.all([
      query("SELECT COUNT(*) AS n FROM jobs WHERE status='active'"),
      query("SELECT COUNT(*) AS n FROM companies"),
      query("SELECT COUNT(*) AS n FROM candidates"),
    ]);
    res.json({ jobs: jobs.n, companies: companies.n, candidates: candidates.n });
  })
);

export default router;
