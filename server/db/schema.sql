-- ============================================================================
-- Rojgaar Job Portal — MySQL schema (MySQL 8+)
-- App-generated CHAR(36) UUID primary keys. JSON columns for list fields.
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE IF NOT EXISTS users (
  id            CHAR(36)     NOT NULL PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('candidate','recruiter','admin') NOT NULL DEFAULT 'candidate',
  full_name     VARCHAR(255),
  phone         VARCHAR(40),
  avatar_url    VARCHAR(1024),
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX users_role_idx (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS companies (
  id                  CHAR(36)     NOT NULL PRIMARY KEY,
  name                VARCHAR(255) NOT NULL,
  slug                VARCHAR(255) NOT NULL UNIQUE,
  logo_url            VARCHAR(1024),
  website             VARCHAR(1024),
  description         TEXT,
  industry            VARCHAR(120),
  company_size        VARCHAR(40),
  location            VARCHAR(255),
  is_verified         TINYINT(1)   NOT NULL DEFAULT 0,
  verification_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  created_by          CHAR(36),
  created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_companies_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS recruiters (
  id          CHAR(36) NOT NULL PRIMARY KEY,
  company_id  CHAR(36),
  designation VARCHAR(120),
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_recruiters_user FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_recruiters_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS candidates (
  id                 CHAR(36) NOT NULL PRIMARY KEY,
  headline           VARCHAR(255),
  about              TEXT,
  location           VARCHAR(255),
  experience_years   DECIMAL(4,1),
  current_salary     BIGINT,
  expected_salary    BIGINT,
  notice_period_days INT,
  resume_url         VARCHAR(1024),
  skills             JSON,
  open_to_work       TINYINT(1) NOT NULL DEFAULT 1,
  updated_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_candidates_user FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS educations (
  id           CHAR(36) NOT NULL PRIMARY KEY,
  candidate_id CHAR(36) NOT NULL,
  institution  VARCHAR(255) NOT NULL,
  degree       VARCHAR(255) NOT NULL,
  field        VARCHAR(255),
  start_year   INT,
  end_year     INT,
  grade        VARCHAR(60),
  CONSTRAINT fk_edu_candidate FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS experiences (
  id           CHAR(36) NOT NULL PRIMARY KEY,
  candidate_id CHAR(36) NOT NULL,
  company      VARCHAR(255) NOT NULL,
  title        VARCHAR(255) NOT NULL,
  location     VARCHAR(255),
  start_date   DATE,
  end_date     DATE,
  is_current   TINYINT(1) NOT NULL DEFAULT 0,
  description  TEXT,
  CONSTRAINT fk_exp_candidate FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS projects (
  id           CHAR(36) NOT NULL PRIMARY KEY,
  candidate_id CHAR(36) NOT NULL,
  title        VARCHAR(255) NOT NULL,
  url          VARCHAR(1024),
  description  TEXT,
  tech         JSON,
  CONSTRAINT fk_proj_candidate FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS jobs (
  id              CHAR(36) NOT NULL PRIMARY KEY,
  recruiter_id    CHAR(36) NOT NULL,
  company_id      CHAR(36) NOT NULL,
  title           VARCHAR(255) NOT NULL,
  slug            VARCHAR(280) NOT NULL,
  description     TEXT,
  responsibilities TEXT,
  requirements    TEXT,
  location        VARCHAR(255),
  job_type        VARCHAR(40) NOT NULL DEFAULT 'full_time',
  work_mode       VARCHAR(40) NOT NULL DEFAULT 'onsite',
  category        VARCHAR(80),
  salary_min      BIGINT,
  salary_max      BIGINT,
  experience_min  DECIMAL(4,1),
  experience_max  DECIMAL(4,1),
  skills          JSON,
  openings        INT NOT NULL DEFAULT 1,
  status          ENUM('draft','active','paused','closed') NOT NULL DEFAULT 'active',
  approval_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'approved',
  is_featured     TINYINT(1) NOT NULL DEFAULT 0,
  is_boosted      TINYINT(1) NOT NULL DEFAULT 0,
  boosted_until   DATETIME,
  views           INT NOT NULL DEFAULT 0,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX jobs_recruiter_idx (recruiter_id),
  INDEX jobs_company_idx (company_id),
  INDEX jobs_status_idx (status, approval_status),
  INDEX jobs_category_idx (category),
  CONSTRAINT fk_jobs_recruiter FOREIGN KEY (recruiter_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_jobs_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS applications (
  id           CHAR(36) NOT NULL PRIMARY KEY,
  job_id       CHAR(36) NOT NULL,
  candidate_id CHAR(36) NOT NULL,
  status       ENUM('applied','shortlisted','interview','offered','hired','rejected') NOT NULL DEFAULT 'applied',
  cover_letter TEXT,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_job_candidate (job_id, candidate_id),
  INDEX applications_candidate_idx (candidate_id),
  CONSTRAINT fk_app_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  CONSTRAINT fk_app_candidate FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS saved_jobs (
  id           CHAR(36) NOT NULL PRIMARY KEY,
  candidate_id CHAR(36) NOT NULL,
  job_id       CHAR(36) NOT NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_saved (candidate_id, job_id),
  CONSTRAINT fk_saved_candidate FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_saved_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS job_alerts (
  id           CHAR(36) NOT NULL PRIMARY KEY,
  candidate_id CHAR(36) NOT NULL,
  keyword      VARCHAR(255),
  location     VARCHAR(255),
  job_type     VARCHAR(40),
  min_salary   BIGINT,
  frequency    VARCHAR(20) NOT NULL DEFAULT 'daily',
  is_active    TINYINT(1) NOT NULL DEFAULT 1,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_alert_candidate FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS conversations (
  id              CHAR(36) NOT NULL PRIMARY KEY,
  recruiter_id    CHAR(36) NOT NULL,
  candidate_id    CHAR(36) NOT NULL,
  job_id          CHAR(36),
  last_message_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_convo (recruiter_id, candidate_id),
  CONSTRAINT fk_convo_recruiter FOREIGN KEY (recruiter_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_convo_candidate FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_convo_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS messages (
  id              CHAR(36) NOT NULL PRIMARY KEY,
  conversation_id CHAR(36) NOT NULL,
  sender_id       CHAR(36) NOT NULL,
  body            TEXT NOT NULL,
  read_at         DATETIME,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX messages_convo_idx (conversation_id, created_at),
  CONSTRAINT fk_msg_convo FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_msg_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS interviews (
  id             CHAR(36) NOT NULL PRIMARY KEY,
  application_id CHAR(36) NOT NULL,
  scheduled_at   DATETIME NOT NULL,
  mode           VARCHAR(20) NOT NULL DEFAULT 'video',
  location       VARCHAR(255),
  meeting_link   VARCHAR(1024),
  notes          TEXT,
  status         VARCHAR(20) NOT NULL DEFAULT 'scheduled',
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX interviews_app_idx (application_id),
  CONSTRAINT fk_iv_app FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS candidate_notes (
  id           CHAR(36) NOT NULL PRIMARY KEY,
  recruiter_id CHAR(36) NOT NULL,
  candidate_id CHAR(36) NOT NULL,
  note         TEXT,
  tags         JSON,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_note (recruiter_id, candidate_id),
  CONSTRAINT fk_note_recruiter FOREIGN KEY (recruiter_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_note_candidate FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS candidate_unlocks (
  id           CHAR(36) NOT NULL PRIMARY KEY,
  recruiter_id CHAR(36) NOT NULL,
  candidate_id CHAR(36) NOT NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_unlock (recruiter_id, candidate_id),
  CONSTRAINT fk_unlock_recruiter FOREIGN KEY (recruiter_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_unlock_candidate FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS coin_wallets (
  id           CHAR(36) NOT NULL PRIMARY KEY,
  recruiter_id CHAR(36) NOT NULL UNIQUE,
  balance      INT NOT NULL DEFAULT 0,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_wallet_recruiter FOREIGN KEY (recruiter_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS coin_transactions (
  id            CHAR(36) NOT NULL PRIMARY KEY,
  wallet_id     CHAR(36) NOT NULL,
  type          ENUM('purchase','bonus','spend','refund','expire','package') NOT NULL,
  amount        INT NOT NULL,
  balance_after INT NOT NULL,
  reason        VARCHAR(255),
  reference     VARCHAR(255),
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX coin_txn_wallet_idx (wallet_id, created_at),
  CONSTRAINT fk_txn_wallet FOREIGN KEY (wallet_id) REFERENCES coin_wallets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS coin_rules (
  action     VARCHAR(64) NOT NULL PRIMARY KEY,
  label      VARCHAR(255) NOT NULL,
  cost       INT NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS packages (
  id                CHAR(36) NOT NULL PRIMARY KEY,
  name              VARCHAR(120) NOT NULL,
  tier              VARCHAR(40) NOT NULL,
  price             BIGINT NOT NULL,
  coins             INT NOT NULL DEFAULT 0,
  job_posts         INT NOT NULL DEFAULT 0,
  candidate_unlocks INT NOT NULL DEFAULT 0,
  validity_days     INT NOT NULL DEFAULT 30,
  features          JSON,
  is_active         TINYINT(1) NOT NULL DEFAULT 1,
  sort_order        INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS recruiter_packages (
  id                  CHAR(36) NOT NULL PRIMARY KEY,
  recruiter_id        CHAR(36) NOT NULL,
  package_id          CHAR(36) NOT NULL,
  activated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at          DATETIME NOT NULL,
  remaining_job_posts INT NOT NULL DEFAULT 0,
  remaining_unlocks   INT NOT NULL DEFAULT 0,
  status              VARCHAR(20) NOT NULL DEFAULT 'active',
  INDEX rp_recruiter_idx (recruiter_id, status),
  CONSTRAINT fk_rp_recruiter FOREIGN KEY (recruiter_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_rp_package FOREIGN KEY (package_id) REFERENCES packages(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS coupons (
  id             CHAR(36) NOT NULL PRIMARY KEY,
  code           VARCHAR(40) NOT NULL UNIQUE,
  discount_type  VARCHAR(20) NOT NULL DEFAULT 'percent',
  discount_value BIGINT NOT NULL,
  max_uses       INT,
  used_count     INT NOT NULL DEFAULT 0,
  valid_until    DATETIME,
  is_active      TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS orders (
  id                  CHAR(36) NOT NULL PRIMARY KEY,
  recruiter_id        CHAR(36) NOT NULL,
  kind                VARCHAR(20) NOT NULL DEFAULT 'package',
  package_id          CHAR(36),
  coins               INT,
  amount              BIGINT NOT NULL,
  discount            BIGINT NOT NULL DEFAULT 0,
  coupon_code         VARCHAR(40),
  status              ENUM('created','paid','failed','refunded') NOT NULL DEFAULT 'created',
  gateway_ref         VARCHAR(120),
  gateway             VARCHAR(20),
  gateway_order_id    VARCHAR(120),
  gateway_payment_id  VARCHAR(120),
  gateway_signature   VARCHAR(512),
  currency            VARCHAR(8) NOT NULL DEFAULT 'INR',
  package_name        VARCHAR(120),
  payment_status      VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  approval_status     VARCHAR(30),
  coins_to_assign     INT NOT NULL DEFAULT 0,
  coins_assigned      TINYINT(1) NOT NULL DEFAULT 0,
  approved_by         CHAR(36),
  approved_at         DATETIME,
  rejected_by         CHAR(36),
  rejected_at         DATETIME,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX orders_recruiter_idx (recruiter_id, created_at),
  INDEX orders_gateway_order_idx (gateway_order_id),
  INDEX orders_approval_idx (approval_status, payment_status),
  CONSTRAINT fk_order_recruiter FOREIGN KEY (recruiter_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_package FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS payments (
  id         CHAR(36) NOT NULL PRIMARY KEY,
  order_id   CHAR(36) NOT NULL,
  amount     BIGINT NOT NULL,
  method     VARCHAR(20) NOT NULL DEFAULT 'upi',
  status     VARCHAR(20) NOT NULL DEFAULT 'success',
  invoice_no VARCHAR(60) NOT NULL UNIQUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pay_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS notifications (
  id         CHAR(36) NOT NULL PRIMARY KEY,
  user_id    CHAR(36) NOT NULL,
  type       VARCHAR(30) NOT NULL DEFAULT 'system',
  title      VARCHAR(255) NOT NULL,
  body       TEXT,
  link       VARCHAR(1024),
  is_read    TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX notif_user_idx (user_id, is_read, created_at),
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS reports (
  id          CHAR(36) NOT NULL PRIMARY KEY,
  reporter_id CHAR(36),
  target_type VARCHAR(30) NOT NULL,
  target_id   VARCHAR(120) NOT NULL,
  reason      VARCHAR(255) NOT NULL,
  details     TEXT,
  status      VARCHAR(20) NOT NULL DEFAULT 'open',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_report_reporter FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cms_content (
  `key`      VARCHAR(64) NOT NULL PRIMARY KEY,
  title      VARCHAR(255),
  body       TEXT,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS settings (
  `key`      VARCHAR(64) NOT NULL PRIMARY KEY,
  value      JSON NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS audit_logs (
  id         CHAR(36) NOT NULL PRIMARY KEY,
  actor_id   CHAR(36),
  action     VARCHAR(80) NOT NULL,
  entity     VARCHAR(60),
  entity_id  VARCHAR(120),
  meta       JSON,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX audit_created_idx (created_at),
  CONSTRAINT fk_audit_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
