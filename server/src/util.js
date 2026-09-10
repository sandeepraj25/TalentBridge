import { randomUUID } from "node:crypto";

export const uuid = () => randomUUID();

export const JOB_CATEGORIES = [
  "IT & Software",
  "Sales & Marketing",
  "Finance & Accounting",
  "HR & Administration",
  "Design & Creative",
  "Healthcare",
  "Other",
];

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function uniqueSlug(text) {
  return `${slugify(text)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Typed HTTP error the error handler turns into a JSON response. */
export class HttpError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/** Wrap an async route handler so thrown errors reach the error middleware. */
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/** Parse a value that may already be an array/object (mysql2 JSON) or a JSON string. */
export function parseJson(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

/** Normalise a comma-separated string into a trimmed array. */
export function toList(value) {
  if (Array.isArray(value)) return value.map((s) => String(s).trim()).filter(Boolean);
  return String(value || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
