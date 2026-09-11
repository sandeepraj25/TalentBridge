/**
 * Applies db/schema.sql to the configured MySQL database.
 * Creates the database if it does not exist (skip if your host pre-creates it).
 *
 *   node db/migrate.mjs
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import mysql from "mysql2/promise";
import { config } from "../src/config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const conn = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    multipleStatements: true,
  });

  try {
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${config.db.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  } catch (e) {
    console.warn("Could not create database (it may already exist or be pre-provisioned):", e.message);
  }
  await conn.query(`USE \`${config.db.database}\``);

  const schema = await readFile(join(__dirname, "schema.sql"), "utf8");
  await conn.query(schema);

  // Additive, idempotent: existing databases created before `jobs.category` existed.
  const [cols] = await conn.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'jobs' AND COLUMN_NAME = 'category'`,
    [config.db.database]
  );
  if (!cols.length) {
    await conn.query("ALTER TABLE jobs ADD COLUMN category VARCHAR(80) NULL");
    await conn.query("ALTER TABLE jobs ADD INDEX jobs_category_idx (category)");
    console.log("✓ Added jobs.category (nullable, existing rows unchanged)");
  }

  const orderCols = [
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
  const [existingOrderCols] = await conn.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders'`,
    [config.db.database]
  );
  const haveOrder = new Set(existingOrderCols.map((c) => c.COLUMN_NAME));
  for (const [name, ddl] of orderCols) {
    if (haveOrder.has(name)) continue;
    await conn.query(`ALTER TABLE orders ADD COLUMN ${name} ${ddl}`);
    console.log(`✓ Added orders.${name}`);
  }

  console.log(`✓ Schema applied to "${config.db.database}"`);
  await conn.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
