import mysql from "mysql2/promise";
import { config } from "./config.js";

export const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: false,
  timezone: "Z",
});

/** Ensure jobs.category exists without resetting data. Safe to call on every boot. */
export async function ensureJobCategoryColumn() {
  const [rows] = await pool.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jobs' AND COLUMN_NAME = 'category'`
  );
  if (rows.length) return;
  await pool.query("ALTER TABLE jobs ADD COLUMN category VARCHAR(80) NULL");
  try {
    await pool.query("ALTER TABLE jobs ADD INDEX jobs_category_idx (category)");
  } catch {
    /* index may already exist */
  }
}

const ORDER_PAYMENT_COLUMNS = [
  ["gateway", "VARCHAR(20) NULL"],
  ["gateway_order_id", "VARCHAR(120) NULL"],
  ["gateway_payment_id", "VARCHAR(120) NULL"],
  ["gateway_signature", "VARCHAR(512) NULL"],
  ["currency", "VARCHAR(8) NOT NULL DEFAULT 'INR'"],
  ["package_name", "VARCHAR(120) NULL"],
  ["payment_status", "VARCHAR(20) NULL"],
  ["approval_status", "VARCHAR(30) NULL"],
  ["coins_to_assign", "INT NOT NULL DEFAULT 0"],
  ["coins_assigned", "TINYINT(1) NOT NULL DEFAULT 0"],
  ["approved_by", "CHAR(36) NULL"],
  ["approved_at", "DATETIME NULL"],
  ["rejected_by", "CHAR(36) NULL"],
  ["rejected_at", "DATETIME NULL"],
  ["updated_at", "DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"],
];

/** Additive payment columns on existing `orders` tables. Safe to call on every boot. */
export async function ensurePaymentSchema() {
  const [cols] = await pool.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders'`
  );
  const have = new Set(cols.map((c) => c.COLUMN_NAME));
  if (!have.size) return;

  for (const [name, ddl] of ORDER_PAYMENT_COLUMNS) {
    if (have.has(name)) continue;
    await pool.query(`ALTER TABLE orders ADD COLUMN ${name} ${ddl}`);
  }

  try {
    await pool.query("ALTER TABLE orders ADD INDEX orders_gateway_order_idx (gateway_order_id)");
  } catch {
    /* index may already exist */
  }
  try {
    await pool.query("ALTER TABLE orders ADD INDEX orders_approval_idx (approval_status, payment_status)");
  } catch {
    /* index may already exist */
  }

  await pool.query(
    `UPDATE orders SET payment_status = 'PAID', approval_status = COALESCE(approval_status, 'APPROVED'), coins_assigned = 1
     WHERE status = 'paid' AND (payment_status IS NULL OR payment_status = 'PENDING') AND gateway IS NULL`
  );
  await pool.query(`UPDATE orders SET payment_status = 'FAILED' WHERE status = 'failed' AND payment_status IS NULL`);
  await pool.query(`UPDATE orders SET payment_status = 'REFUNDED' WHERE status = 'refunded' AND payment_status IS NULL`);
  await pool.query(`UPDATE orders SET payment_status = 'PENDING' WHERE payment_status IS NULL`);
}

/** Ensure candidates.resume_file_path and resume_original_name exist. Safe to call on every boot. */
export async function ensureResumeColumns() {
  const [rows] = await pool.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'candidates' AND COLUMN_NAME = 'resume_file_path'`
  );
  if (rows.length) return;
  await pool.query("ALTER TABLE candidates ADD COLUMN resume_file_path VARCHAR(1024) NULL");
  await pool.query("ALTER TABLE candidates ADD COLUMN resume_original_name VARCHAR(255) NULL");
}

/** Run a query, return rows. */
export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

/** Run a query, return the first row or null. */
export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] ?? null;
}

/** Run work inside a transaction with a dedicated connection. */
export async function withTransaction(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
