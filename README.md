# Rojgaar — Job Portal

A full job portal connecting **candidates**, **recruiters** and **admins**, built from the
attached feature specification. Candidates search and apply; recruiters post jobs and hire with a
coin-powered suite; admins run the whole platform.

**Fresh stack — no Supabase, no Next.js:**

- **Backend:** Node.js + **Express** REST API
- **Database:** **MySQL** (Hostinger-friendly)
- **Auth:** JWT (bcrypt password hashing)
- **Frontend:** **React** (Vite) SPA + React Router + TanStack Query + Tailwind CSS
- **Deploy target:** Hostinger (static SPA + MySQL on shared hosting, Node API on a VPS) — see [DEPLOY.md](./DEPLOY.md) 

```
job-portal/
├── server/                 # Node.js + Express + MySQL API
│   ├── src/
│   │   ├── index.js        # app entry, CORS, error handler
│   │   ├── config.js db.js auth.js services.js util.js shape.js
│   │   └── routes/         # auth, public, candidate, recruiter, messages, notifications, admin
│   └── db/
│       ├── schema.sql      # full MySQL schema (29 tables)
│       ├── migrate.mjs     # applies the schema
│       └── seed.mjs        # reference data + demo users/jobs
└── client/                 # React (Vite) SPA
    └── src/
        ├── lib/            # api client, auth context, types, constants, utils
        ├── components/     # ui, layouts, JobCard
        └── pages/          # public, auth, candidate, recruiter, admin, shared
```

## Feature coverage

**Candidate** — profile (education/experience/projects, resume), job search with filters,
one-click apply, application status tracking, saved jobs, job alerts, skill-matched
recommendations, messaging, interviews, notifications.

**Recruiter** — company profile (with verification), post/edit/pause/close jobs, applications,
kanban pipeline, candidate search with **coin-gated contact unlock**, private notes/tags,
interview scheduling, **coin wallet**, **packages + coupons + (mock) payments**, boost/feature
jobs, analytics, messaging.

**Admin** — users (suspend/grant coins), companies (verify), jobs (approve/reject/remove),
approvals queue, packages, coin rules, payments, coupons, reports, CMS, analytics, settings,
audit logs.

## Local development

You need **Node 18+** and a **MySQL 8** (or MariaDB 10.4+) instance.

```bash
# 1. API
cd server
cp .env.example .env         # set DB_* + JWT_SECRET
npm install
npm run migrate              # create tables
npm run seed                 # demo data (optional)
npm run dev                  # http://localhost:4000

# 2. Frontend (new terminal)
cd client
npm install
npm run dev                  # http://localhost:5173  (proxies /api → :4000)
```

Open http://localhost:5173. Demo logins (password `Password123!`):

| Role | Email |
|------|-------|
| Admin | `admin@rojgaar.example` |
| Recruiter | `recruiter@rojgaar.example` |
| Candidate | `priya@example.com`, `arjun@example.com` |

## API surface

REST under `/api`: `/auth/*`, `/jobs`, `/companies`, `/packages`, `/content/:key`, `/stats`,
`/candidate/*`, `/recruiter/*`, `/messages/*`, `/notifications/*`, `/admin/*`. All mutating and
role-specific routes require a `Bearer` token; role is enforced in Express middleware.

## Security notes

- Passwords are bcrypt-hashed; sessions are stateless JWTs.
- Authorization is enforced per route (`authRequired`, `requireRole`).
- Coin spends are **atomic** (`SELECT … FOR UPDATE` inside a transaction) so balances can't go negative.
- Candidate contact details are **gated** — revealed only after a coin/package unlock.
- The payment step is a **mock gateway**; swap it for Razorpay/Stripe verification before going live (see DEPLOY.md).

## Deployment

See [**DEPLOY.md**](./DEPLOY.md) for Hostinger instructions (shared hosting + VPS, or all-in-one VPS).
