import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "./config.js";
import { queryOne } from "./db.js";
import { HttpError, asyncHandler } from "./util.js";

export const hashPassword = (pw) => bcrypt.hash(pw, 10);
export const verifyPassword = (pw, hash) => bcrypt.compare(pw, hash);

export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

function readToken(req) {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) return header.slice(7);
  return null;
}

/** Loads req.user from the bearer token if present (no error if missing). */
export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = readToken(req);
  if (token) {
    try {
      const payload = jwt.verify(token, config.jwtSecret);
      const user = await queryOne(
        "SELECT id, email, role, full_name, phone, avatar_url, is_active FROM users WHERE id = ?",
        [payload.sub]
      );
      if (user && user.is_active) req.user = user;
    } catch {
      /* ignore invalid token for optional auth */
    }
  }
  next();
});

/** Requires a valid token + active account. */
export const authRequired = asyncHandler(async (req, _res, next) => {
  const token = readToken(req);
  if (!token) throw new HttpError(401, "Authentication required");
  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    throw new HttpError(401, "Invalid or expired session");
  }
  const user = await queryOne(
    "SELECT id, email, role, full_name, phone, avatar_url, is_active FROM users WHERE id = ?",
    [payload.sub]
  );
  if (!user) throw new HttpError(401, "Account not found");
  if (!user.is_active) throw new HttpError(403, "Account suspended");
  req.user = user;
  next();
});

/** Requires one of the given roles (use after authRequired). */
export const requireRole = (...roles) =>
  asyncHandler(async (req, _res, next) => {
    if (!req.user) throw new HttpError(401, "Authentication required");
    if (!roles.includes(req.user.role)) throw new HttpError(403, "You don't have access to this resource");
    next();
  });
