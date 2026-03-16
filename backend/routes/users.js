const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { requireRole, requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/users — admin only
router.get('/', requireRole('admin'), (req, res) => {
  const users = db.prepare('SELECT id, name, email, role, created_at FROM users ORDER BY role, name').all();
  res.json(users);
});

// GET /api/users/instructors — for dropdowns
router.get('/instructors', requireRole('admin'), (req, res) => {
  const instructors = db.prepare("SELECT id, name, email FROM users WHERE role = 'instructor' ORDER BY name").all();
  res.json(instructors);
});

// POST /api/users — admin creates a user
router.post('/', requireRole('admin'), (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (!['admin', 'instructor', 'trainee'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'A user with that email already exists.' });
  }

  const id = uuidv4();
  const hashed = bcrypt.hashSync(password, 10);

  db.prepare('INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)').run(
    id, name, email.toLowerCase().trim(), hashed, role
  );

  // If trainee, create their trainee profile too
  if (role === 'trainee') {
    db.prepare('INSERT INTO trainees (id, user_id) VALUES (?, ?)').run(uuidv4(), id);
  }

  res.status(201).json({ id, name, email, role });
});

// PUT /api/users/:id — admin updates a user
router.put('/:id', requireRole('admin'), (req, res) => {
  const { name, email, password, role } = req.body;
  const { id } = req.params;

  if (name)  db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, id);
  if (email) db.prepare('UPDATE users SET email = ? WHERE id = ?').run(email.toLowerCase(), id);
  if (role)  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
  if (password) {
    const hashed = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, id);
  }

  res.json({ message: 'User updated.' });
});

// DELETE /api/users/:id — admin only
router.delete('/:id', requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ message: 'User deleted.' });
});

// POST /api/users/change-password — any logged in user can change their own
router.post('/change-password', requireAuth, (req, res) => {
  const { id: userId } = req.session.user;
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password) {
    return res.status(400).json({ error: 'Current and new password are required.' });
  }
  if (new_password.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!bcrypt.compareSync(current_password, user.password)) {
    return res.status(401).json({ error: 'Current password is incorrect.' });
  }

  const hashed = bcrypt.hashSync(new_password, 10);
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, userId);

  res.json({ message: 'Password changed successfully.' });
});

module.exports = router;