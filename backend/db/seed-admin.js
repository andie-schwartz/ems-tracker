const DB_PATH = process.env.NODE_ENV === 'production' ? '/app/data/ems.db' : 'backend/db/ems.db';
const db = require('better-sqlite3')(DB_PATH);

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const id = uuidv4();
const pw = bcrypt.hashSync('admin123', 10);

db.prepare('INSERT OR IGNORE INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)')
  .run(id, 'Administrator', 'admin@ems.local', pw, 'admin');

console.log('✅ Admin created!');
db.close();
