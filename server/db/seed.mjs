/**
 * Seeds reference data (coin rules, packages, coupons, CMS, settings) and a
 * demo dataset (admin, recruiter, company, jobs, candidates). Idempotent.
 *
 *   node db/seed.mjs
 */
import { pool, query, queryOne } from "../src/db.js";
import { uuid, slugify } from "../src/util.js";
import { hashPassword } from "../src/auth.js";

async function upsertUser(email, password, role, fullName) {
  const existing = await queryOne("SELECT id FROM users WHERE email = ?", [email]);
  if (existing) return existing.id;
  const id = uuid();
  const hash = await hashPassword(password);
  await query("INSERT INTO users (id, email, password_hash, role, full_name) VALUES (?,?,?,?,?)", [id, email, hash, role, fullName]);
  return id;
}

async function main() {
  console.log("Seeding reference data…");

  // Coin rules
  const rules = [
    ["unlock_candidate", "Unlock candidate contact", 5],
    ["unlock_resume", "Download resume", 3],
    ["boost_job", "Boost a job for 7 days", 25],
    ["feature_job", "Feature a job on homepage", 50],
    ["direct_message", "Message a candidate", 2],
  ];
  for (const [action, label, cost] of rules) {
    await query("INSERT INTO coin_rules (action, label, cost) VALUES (?,?,?) ON DUPLICATE KEY UPDATE label=VALUES(label), cost=VALUES(cost)", [action, label, cost]);
  }

  // Packages
  const packages = [
    ["Starter", "starter", 4999, 100, 3, 20, 30, ["3 active job posts", "100 coins included", "20 candidate unlocks", "Email support"], 1],
    ["Growth", "growth", 12999, 300, 10, 75, 60, ["10 active job posts", "300 coins included", "75 candidate unlocks", "Featured company badge", "Priority support"], 2],
    ["Professional", "professional", 29999, 800, 30, 200, 90, ["30 active job posts", "800 coins included", "200 candidate unlocks", "2 featured jobs / month", "Recruiter analytics", "Priority support"], 3],
    ["Enterprise", "enterprise", 74999, 2500, 100, 1000, 180, ["Unlimited-scale posting", "2500 coins included", "1000 candidate unlocks", "Unlimited featured jobs", "Dedicated account manager", "API access"], 4],
  ];
  for (const [name, tier, price, coins, posts, unlocks, days, features, sort] of packages) {
    const existing = await queryOne("SELECT id FROM packages WHERE name = ?", [name]);
    if (existing) {
      await query("UPDATE packages SET tier=?, price=?, coins=?, job_posts=?, candidate_unlocks=?, validity_days=?, features=?, sort_order=?, is_active=1 WHERE id=?",
        [tier, price, coins, posts, unlocks, days, JSON.stringify(features), sort, existing.id]);
    } else {
      await query("INSERT INTO packages (id, name, tier, price, coins, job_posts, candidate_unlocks, validity_days, features, sort_order) VALUES (?,?,?,?,?,?,?,?,?,?)",
        [uuid(), name, tier, price, coins, posts, unlocks, days, JSON.stringify(features), sort]);
    }
  }

  // Coupons
  const coupons = [
    ["WELCOME10", "percent", 10, 1000],
    ["LAUNCH25", "percent", 25, 500],
    ["FLAT2000", "flat", 2000, 200],
  ];
  for (const [code, type, val, max] of coupons) {
    await query("INSERT INTO coupons (id, code, discount_type, discount_value, max_uses) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE discount_value=VALUES(discount_value)", [uuid(), code, type, val, max]);
  }

  // CMS
  const cms = [
    ["home_hero_title", "Find work you love. Hire talent that lasts.", null],
    ["home_hero_subtitle", null, "India's modern job portal — thousands of roles, one-click apply, and a recruiter suite that respects your budget."],
    ["about", "About Rojgaar", "Rojgaar connects candidates and recruiters across India with a fast, fair and transparent hiring experience."],
    ["terms", "Terms of Service", "These are placeholder terms of service for the Rojgaar job portal."],
    ["privacy", "Privacy Policy", "This placeholder privacy policy describes how Rojgaar handles your data."],
  ];
  for (const [key, title, body] of cms) {
    await query("INSERT INTO cms_content (`key`, title, body) VALUES (?,?,?) ON DUPLICATE KEY UPDATE title=VALUES(title), body=VALUES(body)", [key, title, body]);
  }

  // Settings
  await query("INSERT INTO settings (`key`, value) VALUES ('general', ?) ON DUPLICATE KEY UPDATE value=value", [
    JSON.stringify({ site_name: "Rojgaar", support_email: "support@rojgaar.example", require_job_approval: false, require_company_verification: true, free_job_posts: 1 }),
  ]);

  console.log("Seeding demo users…");
  const adminId = await upsertUser("admin@rojgaar.example", "Password123!", "admin", "Aditi Admin");
  const recruiterId = await upsertUser("recruiter@rojgaar.example", "Password123!", "recruiter", "Rohan Recruiter");
  const cand1 = await upsertUser("priya@example.com", "Password123!", "candidate", "Priya Sharma");
  const cand2 = await upsertUser("arjun@example.com", "Password123!", "candidate", "Arjun Mehta");
  void adminId;

  // Recruiter extension + wallet
  await query("INSERT INTO recruiters (id) VALUES (?) ON DUPLICATE KEY UPDATE id=id", [recruiterId]);
  const wallet = await queryOne("SELECT id FROM coin_wallets WHERE recruiter_id = ?", [recruiterId]);
  if (!wallet) {
    const wid = uuid();
    await query("INSERT INTO coin_wallets (id, recruiter_id, balance) VALUES (?,?,150)", [wid, recruiterId]);
    await query("INSERT INTO coin_transactions (id, wallet_id, type, amount, balance_after, reason) VALUES (?,?,'bonus',150,150,'Seed balance')", [uuid(), wid]);
  }

  // Company
  let company = await queryOne("SELECT id FROM companies WHERE created_by = ? LIMIT 1", [recruiterId]);
  if (!company) {
    const cid = uuid();
    await query(
      "INSERT INTO companies (id, name, slug, website, industry, company_size, location, description, is_verified, verification_status, created_by) VALUES (?,?,?,?,?,?,?,?,1,'approved',?)",
      [cid, "Nimbus Technologies", slugify("Nimbus Technologies"), "https://nimbus.example", "Information Technology", "51-200", "Bengaluru, KA", "We build cloud infrastructure tools used by 2,000+ teams across India.", recruiterId]);
    await query("UPDATE recruiters SET company_id=?, designation='Talent Lead' WHERE id=?", [cid, recruiterId]);
    company = { id: cid };
  }

  // Candidate profiles
  await query("INSERT INTO candidates (id, headline, about, location, experience_years, expected_salary, skills, open_to_work) VALUES (?,?,?,?,?,?,?,1) ON DUPLICATE KEY UPDATE headline=VALUES(headline)",
    [cand1, "Frontend Engineer · React & TypeScript", "5 years building fast, accessible web apps.", "Bengaluru, KA", 5, 2200000, JSON.stringify(["React", "TypeScript", "Next.js", "CSS", "GraphQL"])]);
  await query("INSERT INTO candidates (id, headline, about, location, experience_years, expected_salary, skills, open_to_work) VALUES (?,?,?,?,?,?,?,1) ON DUPLICATE KEY UPDATE headline=VALUES(headline)",
    [cand2, "Backend Engineer · Node & Postgres", "Scales APIs and data pipelines.", "Pune, MH", 3, 1600000, JSON.stringify(["Node.js", "PostgreSQL", "AWS", "Docker"])]);

  // Jobs
  const jobs = [
    ["Senior Frontend Engineer", "full_time", "hybrid", "IT & Software", "Bengaluru, KA", 1800000, 2800000, 4, 8, ["React", "TypeScript", "Next.js"], "Own our web platform end to end. Ship weekly, mentor two engineers.", 1],
    ["Backend Engineer (Node.js)", "full_time", "remote", "IT & Software", "Remote (India)", 1200000, 2000000, 2, 6, ["Node.js", "PostgreSQL", "AWS"], "Design and scale the APIs behind our product.", 0],
    ["Product Design Intern", "internship", "onsite", "Design & Creative", "Bengaluru, KA", 40000, 60000, 0, 1, ["Figma", "UI", "Prototyping"], "6-month internship with the design team.", 0],
  ];
  for (const [title, type, mode, category, loc, smin, smax, emin, emax, skills, desc, featured] of jobs) {
    const existing = await queryOne("SELECT id FROM jobs WHERE recruiter_id=? AND title=?", [recruiterId, title]);
    if (!existing) {
      await query(
        `INSERT INTO jobs (id, recruiter_id, company_id, title, slug, description, location, job_type, work_mode, category, salary_min, salary_max, experience_min, experience_max, skills, status, approval_status, is_featured)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'active','approved',?)`,
        [uuid(), recruiterId, company.id, title, slugify(title) + "-" + Math.random().toString(36).slice(2, 6), desc, loc, type, mode, category, smin, smax, emin, emax, JSON.stringify(skills), featured]);
    }
  }

  const firstJob = await queryOne("SELECT id FROM jobs WHERE recruiter_id=? LIMIT 1", [recruiterId]);
  if (firstJob) {
    await query("INSERT INTO applications (id, job_id, candidate_id, cover_letter) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE cover_letter=VALUES(cover_letter)",
      [uuid(), firstJob.id, cand1, "I'd love to build with you."]);
  }

  console.log("\nDone. Demo logins (password: Password123!):");
  console.log("  admin@rojgaar.example       (admin)");
  console.log("  recruiter@rojgaar.example   (recruiter)");
  console.log("  priya@example.com           (candidate)");
  console.log("  arjun@example.com           (candidate)");
  await pool.end();
}

main().catch(async (e) => {
  console.error(e);
  await pool.end();
  process.exit(1);
});
