import express from "express";
import cors from "cors";
import { ZodError } from "zod";
import { config } from "./config.js";
import { pool, query, ensureJobCategoryColumn, ensurePaymentSchema, ensureResumeColumns } from "./db.js";
import { uuid, HttpError, asyncHandler } from "./util.js";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { authRequired } from "./auth.js";

import authRoutes from "./routes/auth.js";
import publicRoutes from "./routes/public.js";
import candidateRoutes from "./routes/candidate.js";
import recruiterRoutes from "./routes/recruiter.js";
import messageRoutes from "./routes/messages.js";
import notificationRoutes from "./routes/notifications.js";
import adminRoutes from "./routes/admin.js";
import { paymentRouter, paymentWebhookRouter } from "./payments/routes.js";

const app = express();

app.use(
  cors({
    origin: config.clientOrigins,
    credentials: true,
  }),
);

// Webhooks need the raw body for signature verification.
app.use("/api/payments/webhooks", express.raw({ type: "application/json" }), paymentWebhookRouter);
app.use(express.json({ limit: "1mb" }));

// Serve uploaded resumes
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// Health check
app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, db: true });
  } catch {
    res.status(500).json({ ok: false, db: false });
  }
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api", publicRoutes);
app.use("/api/candidate", candidateRoutes);
app.use("/api/recruiter", recruiterRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentRouter);

// Report abuse (any authenticated user)
app.post(
  "/api/reports",
  authRequired,
  asyncHandler(async (req, res) => {
    const b = req.body;
    await query(
      "INSERT INTO reports (id, reporter_id, target_type, target_id, reason, details) VALUES (?,?,?,?,?,?)",
      [uuid(), req.user.id, b.target_type, String(b.target_id), b.reason, b.details || null]
    );
    res.status(201).json({ ok: true });
  })
);

// 404
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: err.issues[0]?.message || "Invalid input", issues: err.issues });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, code: err.code });
  }
  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
});

ensureJobCategoryColumn()
  .then(() => ensurePaymentSchema())
  .then(() => ensureResumeColumns())
  .catch((err) => console.warn("Could not ensure schema:", err.message))
  .finally(() => {
    app.listen(config.port, () => {
      console.log(`Rojgaar API listening on http://localhost:${config.port}`);
    });
  });
