import { pool, query, queryOne, withTransaction } from "./db.js";
import { uuid, HttpError } from "./util.js";

// ---- Notifications & audit -------------------------------------------------
export async function notify(userId, type, title, body = null, link = null) {
  if (!userId) return;
  await query(
    "INSERT INTO notifications (id, user_id, type, title, body, link) VALUES (?,?,?,?,?,?)",
    [uuid(), userId, type, title, body, link]
  );
}

export async function logAudit(actorId, action, entity = null, entityId = null, meta = null) {
  await query(
    "INSERT INTO audit_logs (id, actor_id, action, entity, entity_id, meta) VALUES (?,?,?,?,?,?)",
    [uuid(), actorId, action, entity, entityId, meta ? JSON.stringify(meta) : null]
  );
}

// ---- Coin wallet -----------------------------------------------------------
export async function getOrCreateWallet(recruiterId) {
  let wallet = await queryOne("SELECT * FROM coin_wallets WHERE recruiter_id = ?", [recruiterId]);
  if (!wallet) {
    const id = uuid();
    await query("INSERT INTO coin_wallets (id, recruiter_id, balance) VALUES (?,?,0)", [id, recruiterId]);
    wallet = { id, recruiter_id: recruiterId, balance: 0 };
  }
  return wallet;
}

async function creditCoinsOn(conn, recruiterId, amount, type, reason, reference = null) {
  let [[wallet]] = await conn.execute("SELECT * FROM coin_wallets WHERE recruiter_id = ? FOR UPDATE", [recruiterId]);
  if (!wallet) {
    const id = uuid();
    await conn.execute("INSERT INTO coin_wallets (id, recruiter_id, balance) VALUES (?,?,0)", [id, recruiterId]);
    wallet = { id, balance: 0 };
  }
  const newBalance = wallet.balance + amount;
  await conn.execute("UPDATE coin_wallets SET balance = ? WHERE id = ?", [newBalance, wallet.id]);
  await conn.execute(
    "INSERT INTO coin_transactions (id, wallet_id, type, amount, balance_after, reason, reference) VALUES (?,?,?,?,?,?,?)",
    [uuid(), wallet.id, type, amount, newBalance, reason, reference]
  );
  return newBalance;
}

/** Credit coins (purchase/bonus/package/refund). Atomic. Pass `conn` to join an existing transaction. */
export async function creditCoins(recruiterId, amount, type, reason, reference = null, conn = null) {
  if (conn) return creditCoinsOn(conn, recruiterId, amount, type, reason, reference);
  return withTransaction((c) => creditCoinsOn(c, recruiterId, amount, type, reason, reference));
}

/** Spend coins for an action. Throws HttpError(402) if the balance is short. */
export async function spendCoins(recruiterId, action, reference = null, amountOverride = null) {
  const rule = await queryOne("SELECT cost FROM coin_rules WHERE action = ?", [action]);
  const cost = amountOverride ?? rule?.cost;
  if (cost == null) throw new HttpError(400, `Unknown coin action: ${action}`);

  return withTransaction(async (conn) => {
    let [[wallet]] = await conn.execute("SELECT * FROM coin_wallets WHERE recruiter_id = ? FOR UPDATE", [recruiterId]);
    if (!wallet) {
      const id = uuid();
      await conn.execute("INSERT INTO coin_wallets (id, recruiter_id, balance) VALUES (?,?,0)", [id, recruiterId]);
      wallet = { id, balance: 0 };
    }
    if (wallet.balance < cost) throw new HttpError(402, "Not enough coins", "INSUFFICIENT_COINS");
    const newBalance = wallet.balance - cost;
    await conn.execute("UPDATE coin_wallets SET balance = ? WHERE id = ?", [newBalance, wallet.id]);
    await conn.execute(
      "INSERT INTO coin_transactions (id, wallet_id, type, amount, balance_after, reason, reference) VALUES (?,?,'spend',?,?,?,?)",
      [uuid(), wallet.id, -cost, newBalance, action, reference]
    );
    return newBalance;
  });
}

/** Reveal a candidate's contact by consuming a package unlock, else coins. */
export async function unlockCandidate(recruiterId, candidateId) {
  const existing = await queryOne(
    "SELECT id FROM candidate_unlocks WHERE recruiter_id = ? AND candidate_id = ?",
    [recruiterId, candidateId]
  );
  if (existing) return;

  const pkg = await queryOne(
    "SELECT id FROM recruiter_packages WHERE recruiter_id = ? AND status = 'active' AND expires_at > NOW() AND remaining_unlocks > 0 ORDER BY expires_at ASC LIMIT 1",
    [recruiterId]
  );
  if (pkg) {
    await query("UPDATE recruiter_packages SET remaining_unlocks = remaining_unlocks - 1 WHERE id = ?", [pkg.id]);
  } else {
    await spendCoins(recruiterId, "unlock_candidate", candidateId);
  }
  await query("INSERT INTO candidate_unlocks (id, recruiter_id, candidate_id) VALUES (?,?,?)", [
    uuid(),
    recruiterId,
    candidateId,
  ]);
}

/** Activate a purchased package: create the subscription and grant coins. */
export async function activatePackage(recruiterId, packageId, conn = null) {
  const work = async (c) => {
    const [[pkg]] = await c.execute("SELECT * FROM packages WHERE id = ?", [packageId]);
    if (!pkg) throw new HttpError(404, "Package not found");
    const id = uuid();
    await c.execute(
      `INSERT INTO recruiter_packages (id, recruiter_id, package_id, expires_at, remaining_job_posts, remaining_unlocks, status)
       VALUES (?,?,?, DATE_ADD(NOW(), INTERVAL ? DAY), ?, ?, 'active')`,
      [id, recruiterId, packageId, pkg.validity_days, pkg.job_posts, pkg.candidate_unlocks]
    );
    if (pkg.coins > 0) {
      await creditCoinsOn(c, recruiterId, pkg.coins, "package", `Package: ${pkg.name}`, id);
    }
    return id;
  };
  if (conn) return work(conn);
  return withTransaction(work);
}
