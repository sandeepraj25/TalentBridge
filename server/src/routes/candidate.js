import { Router } from "express";
import { z } from "zod";
import { query, queryOne } from "../db.js";
import { uuid, HttpError, asyncHandler, parseJson, toList } from "../util.js";
import { authRequired, requireRole } from "../auth.js";
import { notify } from "../services.js";
import { JOB_WITH_COMPANY, shapeJob, shapeCandidate } from "../shape.js";

const router = Router();
router.use(authRequired, requireRole("candidate"));

const me = (req) => req.user.id;

// ---- Profile --------------------------------------------------------------
router.get(
  "/profile",
  asyncHandler(async (req, res) => {
    const candidate = await queryOne("SELECT * FROM candidates WHERE id = ?", [me(req)]);
    const [educations, experiences, projects] = await Promise.all([
      query("SELECT * FROM educations WHERE candidate_id = ? ORDER BY end_year DESC", [me(req)]),
      query("SELECT * FROM experiences WHERE candidate_id = ? ORDER BY start_date DESC", [me(req)]),
      query("SELECT * FROM projects WHERE candidate_id = ?", [me(req)]),
    ]);
    res.json({
      profile: req.user,
      candidate: shapeCandidate(candidate),
      educations,
      experiences: experiences.map((e) => ({ ...e, is_current: !!e.is_current })),
      projects: projects.map((p) => ({ ...p, tech: parseJson(p.tech, []) })),
    });
  })
);

const profileSchema = z.object({
  full_name: z.string().min(1),
  phone: z.string().optional().nullable(),
  headline: z.string().optional().nullable(),
  about: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  experience_years: z.coerce.number().optional().nullable(),
  current_salary: z.coerce.number().optional().nullable(),
  expected_salary: z.coerce.number().optional().nullable(),
  notice_period_days: z.coerce.number().optional().nullable(),
  resume_url: z.string().optional().nullable(),
  skills: z.any().optional(),
  open_to_work: z.boolean().optional(),
});

router.put(
  "/profile",
  asyncHandler(async (req, res) => {
    const d = profileSchema.parse(req.body);
    await query("UPDATE users SET full_name = ?, phone = ? WHERE id = ?", [d.full_name, d.phone || null, me(req)]);
    await query(
      `UPDATE candidates SET headline=?, about=?, location=?, experience_years=?, current_salary=?,
        expected_salary=?, notice_period_days=?, resume_url=?, skills=?, open_to_work=? WHERE id = ?`,
      [
        d.headline || null, d.about || null, d.location || null,
        d.experience_years ?? null, d.current_salary ?? null, d.expected_salary ?? null,
        d.notice_period_days ?? null, d.resume_url || null, JSON.stringify(toList(d.skills)),
        d.open_to_work ? 1 : 0, me(req),
      ]
    );
    res.json({ ok: true });
  })
);

// ---- Education / Experience / Projects ------------------------------------
router.post("/education", asyncHandler(async (req, res) => {
  const b = req.body;
  const id = uuid();
  await query("INSERT INTO educations (id, candidate_id, institution, degree, field, start_year, end_year, grade) VALUES (?,?,?,?,?,?,?,?)",
    [id, me(req), b.institution, b.degree, b.field || null, b.start_year || null, b.end_year || null, b.grade || null]);
  res.status(201).json({ id });
}));

router.post("/experience", asyncHandler(async (req, res) => {
  const b = req.body;
  const id = uuid();
  await query("INSERT INTO experiences (id, candidate_id, company, title, location, start_date, end_date, is_current, description) VALUES (?,?,?,?,?,?,?,?,?)",
    [id, me(req), b.company, b.title, b.location || null, b.start_date || null, b.end_date || null, b.is_current ? 1 : 0, b.description || null]);
  res.status(201).json({ id });
}));

router.post("/project", asyncHandler(async (req, res) => {
  const b = req.body;
  const id = uuid();
  await query("INSERT INTO projects (id, candidate_id, title, url, description, tech) VALUES (?,?,?,?,?,?)",
    [id, me(req), b.title, b.url || null, b.description || null, JSON.stringify(toList(b.tech))]);
  res.status(201).json({ id });
}));

router.delete("/:table(educations|experiences|projects)/:id", asyncHandler(async (req, res) => {
  await query(`DELETE FROM ${req.params.table} WHERE id = ? AND candidate_id = ?`, [req.params.id, me(req)]);
  res.json({ ok: true });
}));

// ---- Applications ---------------------------------------------------------
router.get("/applications", asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT a.*, j.title AS job_title, j.salary_min, j.salary_max, c.name AS company_name
     FROM applications a JOIN jobs j ON j.id = a.job_id JOIN companies c ON c.id = j.company_id
     WHERE a.candidate_id = ? ORDER BY a.created_at DESC`, [me(req)]);
  res.json({ applications: rows });
}));

router.post("/applications", asyncHandler(async (req, res) => {
  const jobId = String(req.body.job_id);
  const cover = req.body.cover_letter || null;
  try {
    await query("INSERT INTO applications (id, job_id, candidate_id, cover_letter) VALUES (?,?,?,?)", [uuid(), jobId, me(req), cover]);
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") throw new HttpError(409, "You have already applied to this job");
    throw e;
  }
  const job = await queryOne("SELECT recruiter_id, title FROM jobs WHERE id = ?", [jobId]);
  if (job) await notify(job.recruiter_id, "application", `New application for ${job.title}`, `${req.user.full_name || "A candidate"} just applied.`, "/dashboard/recruiter/applications");
  res.status(201).json({ ok: true });
}));

// ---- Saved jobs -----------------------------------------------------------
router.get("/saved", asyncHandler(async (req, res) => {
  const rows = await query(`${JOB_WITH_COMPANY} JOIN saved_jobs s ON s.job_id = j.id WHERE s.candidate_id = ? ORDER BY s.created_at DESC`, [me(req)]);
  res.json({ jobs: rows.map(shapeJob) });
}));

router.post("/saved/toggle", asyncHandler(async (req, res) => {
  const jobId = String(req.body.job_id);
  const existing = await queryOne("SELECT id FROM saved_jobs WHERE candidate_id = ? AND job_id = ?", [me(req), jobId]);
  if (existing) {
    await query("DELETE FROM saved_jobs WHERE id = ?", [existing.id]);
    res.json({ saved: false });
  } else {
    await query("INSERT INTO saved_jobs (id, candidate_id, job_id) VALUES (?,?,?)", [uuid(), me(req), jobId]);
    res.json({ saved: true });
  }
}));

// ---- Job alerts -----------------------------------------------------------
router.get("/alerts", asyncHandler(async (req, res) => {
  res.json({ alerts: await query("SELECT * FROM job_alerts WHERE candidate_id = ? ORDER BY created_at DESC", [me(req)]) });
}));

router.post("/alerts", asyncHandler(async (req, res) => {
  const b = req.body;
  const id = uuid();
  await query("INSERT INTO job_alerts (id, candidate_id, keyword, location, job_type, min_salary, frequency) VALUES (?,?,?,?,?,?,?)",
    [id, me(req), b.keyword || null, b.location || null, b.job_type || null, b.min_salary || null, b.frequency || "daily"]);
  res.status(201).json({ id });
}));

router.delete("/alerts/:id", asyncHandler(async (req, res) => {
  await query("DELETE FROM job_alerts WHERE id = ? AND candidate_id = ?", [req.params.id, me(req)]);
  res.json({ ok: true });
}));

// ---- Recommended ----------------------------------------------------------
router.get("/recommended", asyncHandler(async (req, res) => {
  const cand = await queryOne("SELECT skills FROM candidates WHERE id = ?", [me(req)]);
  const skills = parseJson(cand?.skills, []);
  let rows;
  if (skills.length) {
    const conds = skills.map(() => "JSON_CONTAINS(j.skills, JSON_QUOTE(?))").join(" OR ");
    rows = await query(
      `${JOB_WITH_COMPANY} WHERE j.status='active' AND j.approval_status='approved' AND (${conds}) ORDER BY j.created_at DESC LIMIT 12`,
      skills
    );
  }
  if (!rows || rows.length === 0) {
    rows = await query(`${JOB_WITH_COMPANY} WHERE j.status='active' AND j.approval_status='approved' ORDER BY j.created_at DESC LIMIT 12`);
  }
  res.json({ jobs: rows.map(shapeJob) });
}));

// ---- Interviews -----------------------------------------------------------
router.get("/interviews", asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT iv.*, j.title AS job_title, c.name AS company_name
     FROM interviews iv JOIN applications a ON a.id = iv.application_id
     JOIN jobs j ON j.id = a.job_id JOIN companies c ON c.id = j.company_id
     WHERE a.candidate_id = ? ORDER BY iv.scheduled_at ASC`, [me(req)]);
  res.json({ interviews: rows });
}));

// ---- Overview -------------------------------------------------------------
router.get("/overview", asyncHandler(async (req, res) => {
  const [[apps], [saved], [interviews]] = await Promise.all([
    query("SELECT COUNT(*) AS n FROM applications WHERE candidate_id = ?", [me(req)]),
    query("SELECT COUNT(*) AS n FROM saved_jobs WHERE candidate_id = ?", [me(req)]),
    query("SELECT COUNT(*) AS n FROM interviews iv JOIN applications a ON a.id = iv.application_id WHERE a.candidate_id = ?", [me(req)]),
  ]);
  const recent = await query(
    `SELECT a.*, j.title AS job_title, c.name AS company_name FROM applications a
     JOIN jobs j ON j.id = a.job_id JOIN companies c ON c.id = j.company_id
     WHERE a.candidate_id = ? ORDER BY a.created_at DESC LIMIT 5`, [me(req)]);
  const candidate = await queryOne("SELECT * FROM candidates WHERE id = ?", [me(req)]);
  res.json({
    stats: { applications: apps.n, saved: saved.n, interviews: interviews.n },
    recent,
    candidate: shapeCandidate(candidate),
  });
}));

export default router;
