const express = require('express');
const db = require('../db');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/settings — admin only
router.get('/', requireRole('admin'), (req, res) => {
  const settings = db.prepare('SELECT * FROM settings').all();
  const result = {};
  settings.forEach(s => { result[s.key] = s.value; });
  res.json(result);
});

// PUT /api/settings — admin updates thresholds
router.put('/', requireRole('admin'), (req, res) => {
  const { alert_threshold, pass_threshold } = req.body;

  if (alert_threshold !== undefined) {
    const val = parseInt(alert_threshold);
    if (val < 1 || val > 7) {
      return res.status(400).json({ error: 'Alert threshold must be between 1 and 7.' });
    }
    db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(String(val), 'alert_threshold');
  }

  if (pass_threshold !== undefined) {
    const val = parseInt(pass_threshold);
    if (val < 1 || val > 7) {
      return res.status(400).json({ error: 'Pass threshold must be between 1 and 7.' });
    }
    db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(String(val), 'pass_threshold');
  }

  res.json({ message: 'Settings updated.' });
});

module.exports = router;