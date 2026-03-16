const db = require('better-sqlite3')('backend/db/ems.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS call_logs (
    id            TEXT PRIMARY KEY,
    trainee_id    TEXT NOT NULL REFERENCES trainees(id) ON DELETE CASCADE,
    call_date     DATE NOT NULL,
    call_type     TEXT NOT NULL,
    supervisor    TEXT,
    notes         TEXT,
    logged_by     TEXT NOT NULL REFERENCES users(id),
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

console.log('✅ Call logs table created!');
db.close();