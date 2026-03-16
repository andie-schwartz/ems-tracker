const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

const CALL_TYPES = ['Cardiac', 'Trauma', 'Medical', 'Respiratory', 'Neurological', 'OB/GYN', 'Pediatric', 'Psychiatric', 'Other'];

// GET /api/calllogs/trainee/:traineeId
router.get('/trainee/:traineeId', requireAuth, (req, res) => {
  const { role, id: userId } = req.session.user;
  const { traineeId } = req.params;

  const trainee = db.prepare('SELECT * FROM trainees WHERE id = ?').get(traineeId);
  if (!trainee) return res.status(404).json({ error: 'Trainee not found.' });

  if (role === 'trainee' && trainee.user_id !== userId) {
    return res.status(403).json({ error: 'Access denied.' });
  }
  if (role === 'instructor' && trainee.instructor_id !== userId) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const logs = db.prepare(`
    SELECT c.*, u.name AS logged_by_name
    FROM call_logs c
    JOIN users u ON u.id = c.logged_by
    WHERE c.trainee_id = ?
    ORDER BY c.call_date DESC
  `).all(traineeId);

  res.json({ logs, total: logs.length });
});

// POST /api/calllogs/trainee/:traineeId
router.post('/trainee/:traineeId', requireRole('admin', 'instructor'), (req, res) => {
  const { role, id: userId } = req.session.user;
  const { traineeId } = req.params;
  const { call_date, call_type, supervisor, notes } = req.body;

  if (!call_date || !call_type) {
    return res.status(400).json({ error: 'call_date and call_type are required.' });
  }

  const trainee = db.prepare('SELECT * FROM trainees WHERE id = ?').get(traineeId);
  if (!trainee) return res.status(404).json({ error: 'Trainee not found.' });

  if (role === 'instructor' && trainee.instructor_id !== userId) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO call_logs (id, trainee_id, call_date, call_type, supervisor, notes, logged_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, traineeId, call_date, call_type, supervisor || null, notes || null, userId);

  res.status(201).json({ id, message: 'Call logged successfully.' });
});

// DELETE /api/calllogs/:id
router.delete('/:id', requireRole('admin', 'instructor'), (req, res) => {
  db.prepare('DELETE FROM call_logs WHERE id = ?').run(req.params.id);
  res.json({ message: 'Call log deleted.' });
});

// GET /api/calllogs/types — list of call types
router.get('/types', requireAuth, (req, res) => {
  res.json(CALL_TYPES);
});

module.exports = router;