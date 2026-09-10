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

  console.log(`✓ Schema applied to "${config.db.database}"`);
  await conn.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
