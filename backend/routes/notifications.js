const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/notifications — admin and instructor only
router.get('/', requireRole('admin', 'instructor'), (req, res) => {
  const { role, id: userId } = req.session.user;

  let notifications;

  if (role === 'admin') {
    notifications = db.prepare(`
      SELECT n.*, 
             u.name AS trainee_name,
             s.name AS skill_name
      FROM notifications n
      JOIN trainees t ON t.id = n.trainee_id
      JOIN users u ON u.id = t.user_id
      JOIN skills s ON s.id = n.skill_id
      ORDER BY n.created_at DESC
    `).all();
  } else {
    // Instructor only sees notifications for their trainees
    notifications = db.prepare(`
      SELECT n.*,
             u.name AS trainee_name,
             s.name AS skill_name
      FROM notifications n
      JOIN trainees t ON t.id = n.trainee_id
      JOIN users u ON u.id = t.user_id
      JOIN skills s ON s.id = n.skill_id
      WHERE t.instructor_id = ?
      ORDER BY n.created_at DESC
    `).all(userId);
  }

  res.json(notifications);
});

// GET /api/notifications/unread-count
router.get('/unread-count', requireRole('admin', 'instructor'), (req, res) => {
  const { role, id: userId } = req.session.user;

  let count;

  if (role === 'admin') {
    count = db.prepare(`
      SELECT COUNT(*) as count FROM notifications WHERE is_read = 0
    `).get();
  } else {
    count = db.prepare(`
      SELECT COUNT(*) as count
      FROM notifications n
      JOIN trainees t ON t.id = n.trainee_id
      WHERE t.instructor_id = ? AND n.is_read = 0
    `).get(userId);
  }

  res.json({ count: count.count });
});

// PUT /api/notifications/:id/read — mark one as read
router.put('/:id/read', requireRole('admin', 'instructor'), (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(req.params.id);
  res.json({ message: 'Marked as read.' });
});

// PUT /api/notifications/read-all — mark all as read
router.put('/read-all', requireRole('admin', 'instructor'), (req, res) => {
  const { role, id: userId } = req.session.user;

  if (role === 'admin') {
    db.prepare('UPDATE notifications SET is_read = 1').run();
  } else {
    db.prepare(`
      UPDATE notifications SET is_read = 1
      WHERE trainee_id IN (
        SELECT id FROM trainees WHERE instructor_id = ?
      )
    `).run(userId);
  }

  res.json({ message: 'All marked as read.' });
});

module.exports = router;