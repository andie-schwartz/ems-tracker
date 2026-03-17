const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = process.env.NODE_ENV === 'production'
  ? '/app/data/ems.db'
  : path.join(__dirname, 'ems.db');
  
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    email       TEXT UNIQUE NOT NULL,
    password    TEXT NOT NULL,
    role        TEXT NOT NULL CHECK(role IN ('admin', 'instructor', 'trainee')),
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS trainees (
    id              TEXT PRIMARY KEY,
    user_id         TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    instructor_id   TEXT REFERENCES users(id) ON DELETE SET NULL,
    start_date      DATE,
    expected_end    DATE,
    status          TEXT DEFAULT 'active' CHECK(status IN ('active', 'on_hold', 'completed', 'failed')),
    notes           TEXT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS skill_categories (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    order_index INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS skills (
    id          TEXT PRIMARY KEY,
    category_id TEXT NOT NULL REFERENCES skill_categories(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    order_index INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS skill_evaluations (
    id            TEXT PRIMARY KEY,
    trainee_id    TEXT NOT NULL REFERENCES trainees(id) ON DELETE CASCADE,
    skill_id      TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    score         INTEGER NOT NULL CHECK(score BETWEEN 1 AND 7),
    evaluated_by  TEXT NOT NULL REFERENCES users(id),
    evaluated_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes         TEXT
  );

  CREATE TABLE IF NOT EXISTS trainee_notes (
    id          TEXT PRIMARY KEY,
    trainee_id  TEXT NOT NULL REFERENCES trainees(id) ON DELETE CASCADE,
    author_id   TEXT NOT NULL REFERENCES users(id),
    content     TEXT NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id          TEXT PRIMARY KEY,
    trainee_id  TEXT NOT NULL REFERENCES trainees(id) ON DELETE CASCADE,
    skill_id    TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    score       INTEGER NOT NULL,
    is_read     INTEGER DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

console.log('✅ Tables created');

// Default settings
db.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES ('alert_threshold', '3')`).run();
db.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES ('pass_threshold', '5')`).run();

// Seed skill categories and skills
const categories = [
  { name: 'Patient Assessment', skills: ['Scene size-up', 'Primary survey (ABCDE)', 'Secondary survey', 'Vital signs', 'SAMPLE history', 'OPQRST pain assessment'] },
  { name: 'Airway Management', skills: ['OPA insertion', 'NPA insertion', 'BVM ventilation', 'Suction technique', 'Oxygen delivery'] },
  { name: 'Cardiac & Resuscitation', skills: ['CPR (adult)', 'CPR (pediatric)', 'AED operation', '12-lead ECG', 'Cardiac rhythm recognition'] },
  { name: 'Trauma', skills: ['Tourniquet application', 'Wound packing', 'Spinal motion restriction', 'Splinting', 'Burn assessment'] },
  { name: 'Medical Emergencies', skills: ['Stroke assessment', 'Hypoglycemia treatment', 'Seizure management', 'Anaphylaxis response', 'Overdose response'] },
  { name: 'IV & Medication', skills: ['IV access', 'IO access', 'Medication administration (IM)', 'Medication administration (IV)', 'Fluid administration'] },
  { name: 'Documentation', skills: ['PCR completion', 'Radio communication', 'Handoff report (SBAR)'] },
];

const insertCat  = db.prepare('INSERT OR IGNORE INTO skill_categories (id, name, order_index) VALUES (?, ?, ?)');
const insertSkill = db.prepare('INSERT OR IGNORE INTO skills (id, category_id, name, order_index) VALUES (?, ?, ?, ?)');

categories.forEach((cat, catIdx) => {
  const catId = uuidv4();
  insertCat.run(catId, cat.name, catIdx + 1);
  cat.skills.forEach((skillName, skillIdx) => {
    insertSkill.run(uuidv4(), catId, skillName, skillIdx + 1);
  });
});

console.log('✅ Skills seeded');

// Default