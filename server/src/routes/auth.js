import { Router } from "express";
import { z } from "zod";
import { query, queryOne } from "../db.js";
import { uuid, HttpError, asyncHandler } from "../util.js";
import { hashPassword, verifyPassword, signToken, authRequired } from "../auth.js";
import { getOrCreateWallet, creditCoins } from "../services.js";

const router = Router();

const registerSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["candidate", "recruiter"]),
});

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const data = registerSchema.parse(req.body);
    const email = data.email.toLowerCase();

    const existing = await queryOne("SELECT id FROM users WHERE email = ?", [email]);
    if (existing) throw new HttpError(409, "An account with this email already exists");

    const id = uuid();
    const hash = await hashPassword(data.password);
    await query("INSERT INTO users (id, email, password_hash, role, full_name) VALUES (?,?,?,?,?)", [
      id,
      email,
      hash,
      data.role,
      data.full_name,
    ]);

    if (data.role === "candidate") {
      await query("INSERT INTO candidates (id, skills) VALUES (?, JSON_ARRAY())", [id]);
    } else {
      await query("INSERT INTO recruiters (id) VALUES (?)", [id]);
      await getOrCreateWallet(id);
      await creditCoins(id, 10, "bonus", "Welcome bonus");
    }

    const user = await queryOne("SELECT id, email, role, full_name, phone, avatar_url, is_active FROM users WHERE id = ?", [id]);
    res.status(201).json({ token: signToken(user), user });
  })
);

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const data = loginSchema.parse(req.body);
    const user = await queryOne("SELECT * FROM users WHERE email = ?", [data.email.toLowerCase()]);
    if (!user || !(await verifyPassword(data.password, user.password_hash))) {
      throw new HttpError(401, "Invalid email or password");
    }
    if (!user.is_active) throw new HttpError(403, "Account suspended");
    const safe = { id: user.id, email: user.email, role: user.role, full_name: user.full_name, phone: user.phone, avatar_url: user.avatar_url, is_active: user.is_active };
    res.json({ token: signToken(safe), user: safe });
  })
);

router.get(
  "/me",
  authRequired,
  asyncHandler(async (req, res) => {
    res.json({ user: req.user });
  })
);

export default router;
