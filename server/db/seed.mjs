/**
 * Seeds reference data and demo dataset.
 * Idempotent.
 *
 * Run:
 *   node db/seed.mjs
 */

import { pool, query, queryOne } from "../src/db.js";
import { uuid, slugify } from "../src/util.js";
import { hashPassword } from "../src/auth.js";

async function upsertUser(email, password, role, fullName) {
  const existing = await queryOne(
    "SELECT id FROM users WHERE email = ?",
    [email]
  );

  if (existing) {
    return existing.id;
  }

  const id = uuid();
  const hash = await hashPassword(password);

  await query(
    `INSERT INTO users
     (id, email, password_hash, role, full_name)
     VALUES (?,?,?,?,?)`,
    [id, email, hash, role, fullName]
  );

  return id;
}


async function main() {
  console.log("Seeding reference data…");

  // ============================================================
  // COIN RULES
  // ============================================================

  const rules = [
    ["unlock_candidate", "Unlock candidate contact", 5],
    ["unlock_resume", "Download resume", 3],
    ["boost_job", "Boost a job for 7 days", 25],
    ["feature_job", "Feature a job on homepage", 50],
    ["direct_message", "Message a candidate", 2],
  ];

  for (const [action, label, cost] of rules) {
    await query(
      `INSERT INTO coin_rules
       (action, label, cost)
       VALUES (?,?,?)
       ON DUPLICATE KEY UPDATE
       label=VALUES(label),
       cost=VALUES(cost)`,
      [action, label, cost]
    );
  }

  // ============================================================
  // PACKAGES
  // ============================================================

  const packages = [
    [
      "Starter",
      "starter",
      4999,
      100,
      3,
      20,
      30,
      [
        "3 active job posts",
        "100 coins included",
        "20 candidate unlocks",
        "Email support",
      ],
      1,
    ],
    [
      "Growth",
      "growth",
      12999,
      300,
      10,
      75,
      60,
      [
        "10 active job posts",
        "300 coins included",
        "75 candidate unlocks",
        "Featured company badge",
        "Priority support",
      ],
      2,
    ],
    [
      "Professional",
      "professional",
      29999,
      800,
      30,
      200,
      90,
      [
        "30 active job posts",
        "800 coins included",
        "200 candidate unlocks",
        "2 featured jobs / month",
        "Recruiter analytics",
        "Priority support",
      ],
      3,
    ],
    [
      "Enterprise",
      "enterprise",
      74999,
      2500,
      100,
      1000,
      180,
      [
        "Unlimited-scale posting",
        "2500 coins included",
        "1000 candidate unlocks",
        "Unlimited featured jobs",
        "Dedicated account manager",
        "API access",
      ],
      4,
    ],
  ];

  for (const [
    name,
    tier,
    price,
    coins,
    posts,
    unlocks,
    days,
    features,
    sort,
  ] of packages) {
    const existing = await queryOne(
      "SELECT id FROM packages WHERE name = ?",
      [name]
    );

    if (existing) {
      await query(
        `UPDATE packages
         SET tier=?,
             price=?,
             coins=?,
             job_posts=?,
             candidate_unlocks=?,
             validity_days=?,
             features=?,
             sort_order=?,
             is_active=1
         WHERE id=?`,
        [
          tier,
          price,
          coins,
          posts,
          unlocks,
          days,
          JSON.stringify(features),
          sort,
          existing.id,
        ]
      );
    } else {
      await query(
        `INSERT INTO packages
         (id, name, tier, price, coins, job_posts,
          candidate_unlocks, validity_days, features, sort_order)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [
          uuid(),
          name,
          tier,
          price,
          coins,
          posts,
          unlocks,
          days,
          JSON.stringify(features),
          sort,
        ]
      );
    }
  }

  // ============================================================
  // COUPONS
  // ============================================================

  const coupons = [
    ["WELCOME10", "percent", 10, 1000],
    ["LAUNCH25", "percent", 25, 500],
    ["FLAT2000", "flat", 2000, 200],
  ];

  for (const [code, type, val, max] of coupons) {
    await query(
      `INSERT INTO coupons
       (id, code, discount_type, discount_value, max_uses)
       VALUES (?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
       discount_value=VALUES(discount_value)`,
      [uuid(), code, type, val, max]
    );
  }

  // ============================================================
  // CMS
  // ============================================================

  const cms = [
    [
      "home_hero_title",
      "Find work you love. Hire talent that lasts.",
      null,
    ],
    [
      "home_hero_subtitle",
      null,
      "India's modern job portal — thousands of roles, one-click apply, and a recruiter suite that respects your budget.",
    ],
    [
      "about",
      "About Rojgaar",
      "Rojgaar connects candidates and recruiters across India with a fast, fair and transparent hiring experience.",
    ],
    [
      "terms",
      "Terms of Service",
      "These are placeholder terms of service for the Rojgaar job portal.",
    ],
    [
      "privacy",
      "Privacy Policy",
      "This placeholder privacy policy describes how Rojgaar handles your data.",
    ],
  ];

  for (const [key, title, body] of cms) {
    await query(
      `INSERT INTO cms_content
       (\`key\`, title, body)
       VALUES (?,?,?)
       ON DUPLICATE KEY UPDATE
       title=VALUES(title),
       body=VALUES(body)`,
      [key, title, body]
    );
  }

  // ============================================================
  // SETTINGS
  // ============================================================

  await query(
    `INSERT INTO settings (\`key\`, value)
     VALUES ('general', ?)
     ON DUPLICATE KEY UPDATE value=value`,
    [
      JSON.stringify({
        site_name: "Rojgaar",
        support_email: "support@rojgaar.example",
        require_job_approval: false,
        require_company_verification: true,
        free_job_posts: 1,
      }),
    ]
  );

  // ============================================================
  // USERS
  // ============================================================

  console.log("Seeding demo users…");

  const adminId = await upsertUser(
    "admin@rojgaar.example",
    "Password123!",
    "admin",
    "Aditi Admin"
  );

  // ============================================================
  // 15 RECRUITERS
  // ============================================================

  const recruiters = [
    ["ananya.sharma@rojgaar.example", "Ananya Sharma"],
    ["rohan.mehta@rojgaar.example", "Rohan Mehta"],
    ["priya.nair@rojgaar.example", "Priya Nair"],
    ["arjun.kapoor@rojgaar.example", "Arjun Kapoor"],
    ["neha.verma@rojgaar.example", "Neha Verma"],
    ["karan.malhotra@rojgaar.example", "Karan Malhotra"],
    ["sneha.iyer@rojgaar.example", "Sneha Iyer"],
    ["aditya.singh@rojgaar.example", "Aditya Singh"],
    ["simran.kaur@rojgaar.example", "Simran Kaur"],
    ["rahul.joshi@rojgaar.example", "Rahul Joshi"],
    ["meera.gupta@rojgaar.example", "Meera Gupta"],
    ["vikram.rao@rojgaar.example", "Vikram Rao"],
    ["yash.thakur@rojgaar.example", "Yash Thakur"],
    ["kavya.menon@rojgaar.example", "Kavya Menon"],
    ["nikhil.sharma@rojgaar.example", "Nikhil Sharma"],
  ];

  const recruiterIds = [];

  for (const [email, fullName] of recruiters) {
    const id = await upsertUser(
      email,
      "Password123!",
      "recruiter",
      fullName
    );

    recruiterIds.push(id);

    await query(
      `INSERT INTO recruiters (id)
       VALUES (?)
       ON DUPLICATE KEY UPDATE id=id`,
      [id]
    );

    const wallet = await queryOne(
      "SELECT id FROM coin_wallets WHERE recruiter_id=?",
      [id]
    );

    if (!wallet) {
      const walletId = uuid();

      await query(
        `INSERT INTO coin_wallets
         (id, recruiter_id, balance)
         VALUES (?,?,150)`,
        [walletId, id]
      );

      await query(
        `INSERT INTO coin_transactions
         (id, wallet_id, type, amount, balance_after, reason)
         VALUES (?,?,'bonus',150,150,'Seed balance')`,
        [uuid(), walletId]
      );
    }
  }

  // ============================================================
  // CANDIDATES
  // ============================================================

  const cand1 = await upsertUser(
    "priya@example.com",
    "Password123!",
    "candidate",
    "Priya Sharma"
  );

  const cand2 = await upsertUser(
    "arjun@example.com",
    "Password123!",
    "candidate",
    "Arjun Mehta"
  );

  void adminId;

  // ============================================================
  // COMPANIES
  // ============================================================

  const companies = [
    [
      "Vertex Labs",
      "HR Manager",
      "Information Technology",
      "51-200",
      "Bengaluru, Karnataka",
      "https://vertexlabs.example",
      "https://placehold.co/200x200?text=VL",
      "Vertex Labs builds modern web applications and digital products for businesses.",
    ],
    [
      "NovaByte Technologies",
      "Talent Acquisition Specialist",
      "Information Technology",
      "201-500",
      "Hyderabad, Telangana",
      "https://novabyte.example",
      "https://placehold.co/200x200?text=NB",
      "NovaByte Technologies develops scalable software platforms and backend solutions.",
    ],
    [
      "CloudNest Systems",
      "HR Executive",
      "Information Technology",
      "51-200",
      "Pune, Maharashtra",
      "https://cloudnest.example",
      "https://placehold.co/200x200?text=CN",
      "CloudNest Systems provides cloud-based software solutions and technology services.",
    ],
    [
      "CodeCraft Solutions",
      "Recruitment Manager",
      "Information Technology",
      "11-50",
      "Noida, Uttar Pradesh",
      "https://codecraft.example",
      "https://placehold.co/200x200?text=CC",
      "CodeCraft Solutions builds business applications and custom technology solutions.",
    ],
    [
      "PixelForge Digital",
      "Creative Director",
      "Media & Marketing",
      "11-50",
      "Gurugram, Haryana",
      "https://pixelforge.example",
      "https://placehold.co/200x200?text=PF",
      "PixelForge Digital helps brands build strong digital identities through design and branding.",
    ],
    [
      "GrowthSphere Media",
      "Marketing Manager",
      "Media & Marketing",
      "51-200",
      "Delhi, Delhi",
      "https://growthsphere.example",
      "https://placehold.co/200x200?text=GS",
      "GrowthSphere Media helps businesses grow through digital marketing and social media.",
    ],
    [
      "FinEdge Technologies",
      "Senior HR Executive",
      "Finance & Banking",
      "201-500",
      "Chennai, Tamil Nadu",
      "https://finedge.example",
      "https://placehold.co/200x200?text=FE",
      "FinEdge Technologies develops technology solutions for the financial services industry.",
    ],
    [
      "AppNova Technologies",
      "People Operations Manager",
      "Information Technology",
      "51-200",
      "Bengaluru, Karnataka",
      "https://appnova.example",
      "https://placehold.co/200x200?text=AN",
      "AppNova Technologies builds mobile and web applications for businesses.",
    ],
    [
      "BrightReach Solutions",
      "HR Business Partner",
      "Consulting",
      "11-50",
      "Mumbai, Maharashtra",
      "https://brightreach.example",
      "https://placehold.co/200x200?text=BR",
      "BrightReach Solutions provides business consulting and sales support services.",
    ],
    [
      "DevOrbit Systems",
      "Technical Recruiter",
      "Information Technology",
      "201-500",
      "Hyderabad, Telangana",
      "https://devorbit.example",
      "https://placehold.co/200x200?text=DO",
      "DevOrbit Systems specializes in cloud infrastructure, DevOps, and software engineering.",
    ],
    [
      "FinCore Services",
      "Finance HR Manager",
      "Finance & Banking",
      "51-200",
      "Mumbai, Maharashtra",
      "https://fincore.example",
      "https://placehold.co/200x200?text=FC",
      "FinCore Services provides financial and accounting services to businesses.",
    ],
    [
      "InnoWave Solutions",
      "Talent Acquisition Manager",
      "Information Technology",
      "51-200",
      "Pune, Maharashtra",
      "https://innowave.example",
      "https://placehold.co/200x200?text=IW",
      "InnoWave Solutions develops software products and technology services.",
    ],
    [
      "TalentBridge India",
      "HR Manager",
      "Consulting",
      "11-50",
      "Noida, Uttar Pradesh",
      "https://talentbridge.example",
      "https://placehold.co/200x200?text=TB",
      "TalentBridge India provides recruitment and human resource consulting services.",
    ],
    [
      "CarePlus Health",
      "HR & Operations Manager",
      "Healthcare",
      "201-500",
      "Pune, Maharashtra",
      "https://careplus.example",
      "https://placehold.co/200x200?text=CH",
      "CarePlus Health provides healthcare services supported by technology and efficient operations.",
    ],
    [
      "BrandVista Creative",
      "Creative Hiring Manager",
      "Media & Marketing",
      "11-50",
      "Jaipur, Rajasthan",
      "https://brandvista.example",
      "https://placehold.co/200x200?text=BV",
      "BrandVista Creative specializes in branding, graphic design, digital content, and social media.",
    ],
  ];

  const companyIds = [];

  for (let i = 0; i < companies.length; i++) {
    const [
      name,
      designation,
      industry,
      size,
      location,
      website,
      logo,
      description,
    ] = companies[i];

    const recruiterId = recruiterIds[i];

    let company = await queryOne(
      `SELECT id
       FROM companies
       WHERE created_by=? AND name=?
       LIMIT 1`,
      [recruiterId, name]
    );

    if (!company) {
      const companyId = uuid();

      await query(
        `INSERT INTO companies
         (id, name, slug, website, industry, company_size,
          location, description, is_verified,
          verification_status, created_by)
         VALUES (?,?,?,?,?,?,?,?,1,'approved',?)`,
        [
          companyId,
          name,
          slugify(name),
          website,
          industry,
          size,
          location,
          description,
          recruiterId,
        ]
      );

      await query(
        "UPDATE companies SET logo_url=? WHERE id=?",
        [logo, companyId]
      );

      company = {
        id: companyId,
      };
    } else {
      await query(
        `UPDATE companies
         SET website=?,
             industry=?,
             company_size=?,
             location=?,
             description=?,
             logo_url=?,
             is_verified=1,
             verification_status='approved'
         WHERE id=?`,
        [
          website,
          industry,
          size,
          location,
          description,
          logo,
          company.id,
        ]
      );
    }

    companyIds.push(company.id);

    // Link recruiter → company
    await query(
      `UPDATE recruiters
       SET company_id=?,
           designation=?
       WHERE id=?`,
      [company.id, designation, recruiterId]
    );
  }

  // ============================================================
  // CANDIDATE PROFILES
  // ============================================================

  await query(
    `INSERT INTO candidates
     (id, headline, about, location,
      experience_years, expected_salary, skills, open_to_work)
     VALUES (?,?,?,?,?,?,?,1)
     ON DUPLICATE KEY UPDATE
     headline=VALUES(headline)`,
    [
      cand1,
      "Frontend Engineer · React & TypeScript",
      "5 years building fast, accessible web apps.",
      "Bengaluru, KA",
      5,
      2200000,
      JSON.stringify([
        "React",
        "TypeScript",
        "Next.js",
        "CSS",
        "GraphQL",
      ]),
    ]
  );

  await query(
    `INSERT INTO candidates
     (id, headline, about, location,
      experience_years, expected_salary, skills, open_to_work)
     VALUES (?,?,?,?,?,?,?,1)
     ON DUPLICATE KEY UPDATE
     headline=VALUES(headline)`,
    [
      cand2,
      "Backend Engineer · Node & Postgres",
      "Scales APIs and data pipelines.",
      "Pune, MH",
      3,
      1600000,
      JSON.stringify([
        "Node.js",
        "PostgreSQL",
        "AWS",
        "Docker",
      ]),
    ]
  );

  // ============================================================
  // JOBS
  // ============================================================

  const jobs = [
    [
      "Frontend Developer",
      "full_time",
      "hybrid",
      "IT & Software",
      "Bengaluru, Karnataka",
      1000000,
      1800000,
      1,
      4,
      ["React", "JavaScript", "TypeScript", "HTML", "CSS"],
      "Build responsive and user-friendly web applications for our digital products.",
      1,
    ],
    [
      "Backend Engineer",
      "full_time",
      "remote",
      "IT & Software",
      "Hyderabad, Telangana",
      1200000,
      2200000,
      2,
      6,
      ["Node.js", "Express", "PostgreSQL", "REST API", "AWS"],
      "Design and develop scalable backend services and APIs for our software platform.",
      0,
    ],
    [
      "Full Stack Developer",
      "full_time",
      "hybrid",
      "IT & Software",
      "Pune, Maharashtra",
      900000,
      1700000,
      1,
      4,
      ["React", "Node.js", "MongoDB", "JavaScript"],
      "Work across frontend and backend systems to build complete web applications.",
      0,
    ],
    [
      "Software Engineer",
      "full_time",
      "onsite",
      "IT & Software",
      "Noida, Uttar Pradesh",
      800000,
      1600000,
      0,
      3,
      ["Java", "Spring Boot", "MySQL", "REST API"],
      "Develop reliable software applications and contribute to product development.",
      0,
    ],
    [
      "UI/UX Designer",
      "full_time",
      "hybrid",
      "Design & Creative",
      "Gurugram, Haryana",
      600000,
      1200000,
      1,
      4,
      ["Figma", "UI Design", "UX Design", "Prototyping"],
      "Design simple and engaging user experiences for web and mobile products.",
      1,
    ],
    [
      "Digital Marketing Executive",
      "full_time",
      "onsite",
      "Sales & Marketing",
      "Delhi, Delhi",
      400000,
      800000,
      0,
      3,
      ["SEO", "Social Media", "Google Ads", "Content Marketing"],
      "Plan and execute digital marketing campaigns to increase brand visibility and leads.",
      0,
    ],
    [
      "Java Developer",
      "full_time",
      "hybrid",
      "IT & Software",
      "Chennai, Tamil Nadu",
      900000,
      1800000,
      1,
      5,
      ["Java", "Spring Boot", "Hibernate", "MySQL"],
      "Develop secure and scalable Java applications for financial technology products.",
      0,
    ],
    [
      "Android Developer",
      "full_time",
      "hybrid",
      "IT & Software",
      "Bengaluru, Karnataka",
      700000,
      1500000,
      1,
      4,
      ["Kotlin", "Android", "Jetpack", "Firebase"],
      "Build and maintain high-quality Android applications for business users.",
      0,
    ],
    [
      "Sales Executive",
      "full_time",
      "onsite",
      "Sales & Marketing",
      "Mumbai, Maharashtra",
      350000,
      700000,
      0,
      3,
      ["Sales", "Communication", "Lead Generation", "CRM"],
      "Generate new business opportunities and maintain strong client relationships.",
      0,
    ],
    [
      "DevOps Engineer",
      "full_time",
      "remote",
      "IT & Software",
      "Hyderabad, Telangana",
      1200000,
      2400000,
      2,
      6,
      ["AWS", "Docker", "Kubernetes", "CI/CD", "Linux"],
      "Manage cloud infrastructure, deployment pipelines, monitoring, and system reliability.",
      1,
    ],
    [
      "Accountant",
      "full_time",
      "onsite",
      "Finance & Accounting",
      "Mumbai, Maharashtra",
      450000,
      900000,
      1,
      5,
      ["Tally", "Excel", "Accounting", "GST"],
      "Manage accounting records, invoices, reconciliations, and financial reporting.",
      0,
    ],
    [
      "Python Developer",
      "full_time",
      "hybrid",
      "IT & Software",
      "Pune, Maharashtra",
      800000,
      1700000,
      1,
      4,
      ["Python", "Django", "REST API", "PostgreSQL"],
      "Build backend applications and APIs using Python and modern development practices.",
      0,
    ],
    [
      "Next.js Developer",
      "full_time",
      "remote",
      "IT & Software",
      "Noida, Uttar Pradesh",
      900000,
      1800000,
      1,
      4,
      ["Next.js", "React", "TypeScript", "Tailwind CSS"],
      "Develop fast and SEO-friendly web applications using Next.js and React.",
      1,
    ],
    [
      "HR Executive",
      "full_time",
      "onsite",
      "HR & Administration",
      "Pune, Maharashtra",
      400000,
      800000,
      0,
      3,
      ["Recruitment", "HR Operations", "Communication", "MS Excel"],
      "Handle recruitment, employee coordination, onboarding, and daily HR operations.",
      0,
    ],
    [
      "Healthcare Operations Executive",
      "full_time",
      "onsite",
      "Healthcare",
      "Pune, Maharashtra",
      450000,
      850000,
      1,
      4,
      ["Healthcare Operations", "MS Excel", "Communication", "Documentation"],
      "Coordinate healthcare operations and ensure smooth communication between teams.",
      0,
    ],
    [
      "Graphic Designer",
      "full_time",
      "hybrid",
      "Design & Creative",
      "Jaipur, Rajasthan",
      400000,
      900000,
      0,
      3,
      ["Photoshop", "Illustrator", "Figma", "Graphic Design"],
      "Create engaging visual content for branding, social media, and digital campaigns.",
      0,
    ],
  ];

  // ============================================================
  // INSERT JOBS
  // ============================================================

  for (let i = 0; i < jobs.length; i++) {
    const [
      title,
      type,
      mode,
      category,
      location,
      salaryMin,
      salaryMax,
      experienceMin,
      experienceMax,
      skills,
      description,
      featured,
    ] = jobs[i];

    const recruiterId = recruiterIds[i % recruiterIds.length];
  const companyId = companyIds[i % companyIds.length];

    const existing = await queryOne(
      `SELECT id
       FROM jobs
       WHERE recruiter_id=? AND title=?`,
      [recruiterId, title]
    );

    if (!existing) {
      await query(
        `INSERT INTO jobs
         (id, recruiter_id, company_id, title, slug,
          description, location, job_type, work_mode,
          category, salary_min, salary_max,
          experience_min, experience_max, skills,
          status, approval_status, is_featured)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,
                 'active','approved',?)`,
        [
          uuid(),
          recruiterId,
          companyId,
          title,
          slugify(title) +
          "-" +
          Math.random().toString(36).slice(2, 6),
          description,
          location,
          type,
          mode,
          category,
          salaryMin,
          salaryMax,
          experienceMin,
          experienceMax,
          JSON.stringify(skills),
          featured,
        ]
      );
    }
  }

  // ============================================================
  // DEMO APPLICATION
  // ============================================================

  const firstJob = await queryOne(
    `SELECT id
     FROM jobs
     WHERE recruiter_id=?
     LIMIT 1`,
    [recruiterIds[0]]
  );

  if (firstJob) {
    await query(
      `INSERT INTO applications
       (id, job_id, candidate_id, cover_letter)
       VALUES (?,?,?,?)
       ON DUPLICATE KEY UPDATE
       cover_letter=VALUES(cover_letter)`,
      [
        uuid(),
        firstJob.id,
        cand1,
        "I'd love to build with you.",
      ]
    );
  }

  // ============================================================
  // DONE
  // ============================================================

  console.log("");
  console.log("======================================");
  console.log("        SEEDING COMPLETED");
  console.log("======================================");
  console.log("");
  console.log("Admin:");
  console.log("admin@rojgaar.example");
  console.log("");

  console.log("Recruiters:");

  for (const [email, name] of recruiters) {
    console.log(`- ${name} → ${email}`);
  }

  console.log("");
  console.log("Candidates:");
  console.log("priya@example.com");
  console.log("arjun@example.com");
  console.log("");
  console.log("Password for demo accounts: Password123!");
  console.log("");
  console.log("Created/linked:");
  console.log("- 15 Recruiters");
  console.log("- 15 Companies");
  console.log("- 15 Jobs");
  console.log("- Recruiter wallets");
  console.log("- 2 Candidates");
  console.log("- 1 Demo application");
  console.log("");

  await pool.end();
}

main().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});