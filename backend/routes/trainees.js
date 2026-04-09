const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Helper to get a trainee with full info
function getTraineeById(id) {
  const trainee = db.prepare(`
    SELECT t.*, u.name AS trainee_name, u.email AS trainee_email,
           i.name AS instructor_name
    FROM trainees t
    JOIN users u ON u.id = t.user_id
    LEFT JOIN users i ON i.id = t.instructor_id
    WHERE t.id = ?
  `).get(id);

  if (trainee) {
    // Get all assigned instructors
    trainee.instructors = db.prepare(`
      SELECT u.id, u.name, u.email
      FROM trainee_instructors ti
      JOIN users u ON u.id = ti.instructor_id
      WHERE ti.trainee_id = ?
    `).all(id);
  }

  return trainee;
}

// Check if instructor is assigned to trainee
function isAssignedInstructor(traineeId, instructorId) {
  const direct = db.prepare('SELECT id FROM trainees WHERE id = ? AND instructor_id = ?').get(traineeId, instructorId);
  const multi = db.prepare('SELECT * FROM trainee_instructors WHERE trainee_id = ? AND instructor_id = ?').get(traineeId, instructorId);
  return !!(direct || multi);
}

// GET /api/trainees
router.get('/', requireAuth, (req, res) => {
  const { role, id: userId } = req.session.user;

  let trainees;

  if (role === 'admin') {
    trainees = db.prepare(`
      SELECT t.*, u.name AS trainee_name, u.email AS trainee_email,
             i.name AS instructor_name
      FROM trainees t
      JOIN users u ON u.id = t.user_id
      LEFT JOIN users i ON i.id = t.instructor_id
      ORDER BY t.start_date ASC
    `).all();
  } else if (role === 'instructor') {
    // Get trainees where instructor is primary OR in the join table
    trainees = db.prepare(`
      SELECT DISTINCT t.*, u.name AS trainee_name, u.email AS trainee_email,
             i.name AS instructor_name
      FROM trainees t
      JOIN users u ON u.id = t.user_id
      LEFT JOIN users i ON i.id = t.instructor_id
      LEFT JOIN trainee_instructors ti ON ti.trainee_id = t.id
      WHERE t.instructor_id = ? OR ti.instructor_id = ?
      ORDER BY t.start_date ASC
    `).all(userId, userId);
  } else {
    trainees = db.prepare(`
      SELECT t.*, u.name AS trainee_name, u.email AS trainee_email,
             i.name AS instructor_name
      FROM trainees t
      JOIN users u ON u.id = t.user_id
      LEFT JOIN users i ON i.id = t.instructor_id
      WHERE t.user_id = ?
    `).all(userId);
  }

  // Add instructors list to each trainee
  trainees = trainees.map(t => ({
    ...t,
    instructors: db.prepare(`
      SELECT u.id, u.name, u.email
      FROM trainee_instructors ti
      JOIN users u ON u.id = ti.instructor_id
      WHERE ti.trainee_id = ?
    `).all(t.id)
  }));

  res.json(trainees);
});

// GET /api/trainees/:id
router.get('/:id', requireAuth, (req, res) => {
  const { role, id: userId } = req.session.user;
  const trainee = getTraineeById(req.params.id);

  if (!trainee) return res.status(404).json({ error: 'Trainee not found.' });

  if (role === 'trainee' && trainee.user_id !== userId) {
    return res.status(403).json({ error: 'Access denied.' });
  }
  if (role === 'instructor' && !isAssignedInstructor(req.params.id, userId)) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  res.json(trainee);
});

// PUT /api/trainees/:id
router.put('/:id', requireRole('admin', 'instructor'), (req, res) => {
  const { role, id: userId } = req.session.user;
  const trainee = getTraineeById(req.params.id);

  if (!trainee) return res.status(404).json({ error: 'Trainee not found.' });

  if (role === 'instructor' && !isAssignedInstructor(req.params.id, userId)) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const { instructor_id, instructor_ids, start_date, expected_end, status, notes } = req.body;

  if (role === 'admin') {
    // Update primary instructor
    if (instructor_id !== undefined) {
      db.prepare('UPDATE trainees SET instructor_id = ? WHERE id = ?').run(instructor_id || null, req.params.id);
    }

    // Update multiple instructors
    if (instructor_ids !== undefined) {
      db.prepare('DELETE FROM trainee_instructors WHERE trainee_id = ?').run(req.params.id);
      instructor_ids.forEach(iid => {
        db.prepare('INSERT OR IGNORE INTO trainee_instructors (trainee_id, instructor_id) VALUES (?, ?)').run(req.params.id, iid);
      });
    }
  }

  if (start_date !== undefined)   db.prepare('UPDATE trainees SET start_date = ? WHERE id = ?').run(start_date, req.params.id);
  if (expected_end !== undefined) db.prepare('UPDATE trainees SET expected_end = ? WHERE id = ?').run(expected_end, req.params.id);
  if (status !== undefined)       db.prepare('UPDATE trainees SET status = ? WHERE id = ?').run(status, req.params.id);
  if (notes !== undefined)        db.prepare('UPDATE trainees SET notes = ? WHERE id = ?').run(notes, req.params.id);

  res.json(getTraineeById(req.params.id));
});

// GET /api/trainees/:id/notes
router.get('/:id/notes', requireAuth, (req, res) => {
  const { role, id: userId } = req.session.user;
  const trainee = getTraineeById(req.params.id);

  if (!trainee) return res.status(404).json({ error: 'Trainee not found.' });
  if (role === 'trainee' && trainee.user_id !== userId) return res.status(403).json({ error: 'Access denied.' });
  if (role === 'instructor' && !isAssignedInstructor(req.params.id, userId)) return res.status(403).json({ error: 'Access denied.' });

  const notes = db.prepare(`
    SELECT n.*, u.name AS author_name
    FROM trainee_notes n
    JOIN users u ON u.id = n.author_id
    WHERE n.trainee_id = ?
    ORDER BY n.created_at DESC
  `).all(req.params.id);

  res.json(notes);
});

// POST /api/trainees/:id/notes
router.post('/:id/notes', requireRole('admin', 'instructor'), (req, res) => {
  const { role, id: userId } = req.session.user;
  const trainee = getTraineeById(req.params.id);

  if (!trainee) return res.status(404).json({ error: 'Trainee not found.' });
  if (role === 'instructor' && !isAssignedInstructor(req.params.id, userId)) return res.status(403).json({ error: 'Access denied.' });

  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Note content is required.' });

  const id = uuidv4();
  db.prepare('INSERT INTO trainee_notes (id, trainee_id, author_id, content) VALUES (?, ?, ?, ?)').run(
    id, req.params.id, userId, content
  );

  res.status(201).json({ id, content });
});

module.exports = router;