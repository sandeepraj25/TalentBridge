import { Router } from "express";
import { query, queryOne } from "../db.js";
import { uuid, HttpError, asyncHandler } from "../util.js";
import { authRequired } from "../auth.js";
import { notify } from "../services.js";

const router = Router();
router.use(authRequired);
const me = (req) => req.user.id;

async function assertParticipant(convoId, userId) {
  const c = await queryOne("SELECT * FROM conversations WHERE id = ?", [convoId]);
  if (!c || (c.recruiter_id !== userId && c.candidate_id !== userId)) throw new HttpError(403, "Not your conversation");
  return c;
}

// List conversations for the current user (either side)
router.get("/conversations", asyncHandler(async (req, res) => {
  const isRecruiter = req.user.role === "recruiter";
  const otherCol = isRecruiter ? "candidate_id" : "recruiter_id";
  const col = isRecruiter ? "recruiter_id" : "candidate_id";
  const rows = await query(
    `SELECT c.*, u.full_name AS other_name, u.avatar_url AS other_avatar
     FROM conversations c JOIN users u ON u.id = c.${otherCol}
     WHERE c.${col} = ? ORDER BY c.last_message_at DESC`, [me(req)]);
  res.json({ conversations: rows });
}));

// Messages in a conversation
router.get("/conversations/:id/messages", asyncHandler(async (req, res) => {
  await assertParticipant(req.params.id, me(req));
  const rows = await query("SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC", [req.params.id]);
  await query("UPDATE messages SET read_at = NOW() WHERE conversation_id = ? AND sender_id <> ? AND read_at IS NULL", [req.params.id, me(req)]);
  res.json({ messages: rows });
}));

// Send a message
router.post("/conversations/:id/messages", asyncHandler(async (req, res) => {
  const convo = await assertParticipant(req.params.id, me(req));
  const body = String(req.body.body || "").trim();
  if (!body) throw new HttpError(400, "Message cannot be empty");
  await query("INSERT INTO messages (id, conversation_id, sender_id, body) VALUES (?,?,?,?)", [uuid(), req.params.id, me(req), body]);
  await query("UPDATE conversations SET last_message_at = NOW() WHERE id = ?", [req.params.id]);
  const other = me(req) === convo.recruiter_id ? convo.candidate_id : convo.recruiter_id;
  const otherRole = me(req) === convo.recruiter_id ? "candidate" : "recruiter";
  await notify(other, "message", `New message from ${req.user.full_name || "someone"}`, body.slice(0, 80), `/dashboard/${otherRole}/messages`);
  res.status(201).json({ ok: true });
}));

// Recruiter starts (or reuses) a conversation with a candidate
router.post("/conversations", asyncHandler(async (req, res) => {
  if (req.user.role !== "recruiter") throw new HttpError(403, "Only recruiters can start conversations");
  const candidateId = String(req.body.candidate_id);
  let convo = await queryOne("SELECT id FROM conversations WHERE recruiter_id = ? AND candidate_id = ?", [me(req), candidateId]);
  if (!convo) {
    const id = uuid();
    await query("INSERT INTO conversations (id, recruiter_id, candidate_id, job_id) VALUES (?,?,?,?)",
      [id, me(req), candidateId, req.body.job_id || null]);
    convo = { id };
  }
  res.status(201).json({ id: convo.id });
}));

export default router;
