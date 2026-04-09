const DB_PATH = process.env.NODE_ENV === 'production' ? '/app/data/ems.db' : 'backend/db/ems.db';
const db = require('better-sqlite3')(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS trainee_instructors (
    trainee_id    TEXT NOT NULL REFERENCES trainees(id) ON DELETE CASCADE,
    instructor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (trainee_id, instructor_id)
  );
`);

console.log('✅ trainee_instructors table created!');
db.close();