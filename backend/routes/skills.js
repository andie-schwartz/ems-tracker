const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Helper to get thresholds from settings
function getThresholds() {
  const alert = db.prepare("SELECT value FROM settings WHERE key = 'alert_threshold'").get();
  const pass  = db.prepare("SELECT value FROM settings WHERE key = 'pass_threshold'").get();
  return {
    alert: parseInt(alert.value),
    pass:  parseInt(pass.value),
  };
}

// GET /api/skills — all categories and skills
router.get('/', requireAuth, (req, res) => {
  const categories = db.prepare('SELECT * FROM skill_categories ORDER BY order_index').all();
  const skills = db.prepare('SELECT * FROM skills ORDER BY order_index').all();

  const result = categories.map(cat => ({
    ...cat,
    skills: skills.filter(s => s.category_id === cat.id),
  }));

  res.json(result);
});

// GET /api/skills/trainee/:traineeId — full checklist with scores
router.get('/trainee/:traineeId', requireAuth, (req, res) => {
  const { role, id: userId } = req.session.user;
  const { traineeId } = req.params;
  const { alert, pass } = getThresholds();

  const trainee = db.prepare('SELECT * FROM trainees WHERE id = ?').get(traineeId);
  if (!trainee) return res.status(404).json({ error: 'Trainee not found.' });

  if (role === 'trainee' && trainee.user_id !== userId) {
    return res.status(403).json({ error: 'Access denied.' });
  }
  if (role === 'instructor' && trainee.instructor_id !== userId) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const categories = db.prepare('SELECT * FROM skill_categories ORDER BY order_index').all();
  const skills = db.prepare('SELECT * FROM skills ORDER BY order_index').all();

  // Get latest score per skill for this trainee
  const latestScores = db.prepare(`
    SELECT skill_id, score, evaluated_by, evaluated_at,
           u.name AS evaluated_by_name
    FROM skill_evaluations se
    JOIN users u ON u.id = se.evaluated_by
    WHERE se.trainee_id = ?
    AND se.evaluated_at = (
      SELECT MAX(se2.evaluated_at)
      FROM skill_evaluations se2
      WHERE se2.trainee_id = se.trainee_id
      AND se2.skill_id = se.skill_id
    )
  `).all(traineeId);

  const scoreMap = {};
  latestScores.forEach(s => { scoreMap[s.skill_id] = s; });

  const totalSkills = skills.length;
  let passedSkills = 0;

  const result = categories.map(cat => ({
    ...cat,
    skills: skills
      .filter(s => s.category_id === cat.id)
      .map(s => {
        const latest = scoreMap[s.skill_id] || scoreMap[s.id] || null;
        const score = latest ? latest.score : null;
        const passed = score !== null && score >= pass;
        const flagged = score !== null && score <= alert;
        if (passed) passedSkills++;
        return {
          ...s,
          latest_score: score,
          passed,
          flagged,
          evaluated_by_name: latest ? latest.evaluated_by_name : null,
          evaluated_at: latest ? latest.evaluated_at : null,
        };
      }),
  }));

  res.json({
    categories: result,
    summary: {
      total: totalSkills,
      passed: passedSkills,
      percent: totalSkills > 0 ? Math.round((passedSkills / totalSkills) * 100) : 0,
    },
    thresholds: { alert, pass },
  });
});

// GET /api/skills/trainee/:traineeId/history/:skillId — full attempt history
router.get('/trainee/:traineeId/history/:skillId', requireAuth, (req, res) => {
  const { role, id: userId } = req.session.user;
  const { traineeId, skillId } = req.params;

  const trainee = db.prepare('SELECT * FROM trainees WHERE id = ?').get(traineeId);
  if (!trainee) return res.status(404).json({ error: 'Trainee not found.' });

  if (role === 'trainee' && trainee.user_id !== userId) {
    return res.status(403).json({ error: 'Access denied.' });
  }
  if (role === 'instructor' && trainee.instructor_id !== userId) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const history = db.prepare(`
    SELECT se.*, u.name AS evaluated_by_name
    FROM skill_evaluations se
    JOIN users u ON u.id = se.evaluated_by
    WHERE se.trainee_id = ? AND se.skill_id = ?
    ORDER BY se.evaluated_at DESC
  `).all(traineeId, skillId);

  res.json(history);
});

// POST /api/skills/evaluate — instructor or admin submits a score
router.post('/evaluate', requireRole('admin', 'instructor'), (req, res) => {
  const { role, id: userId } = req.session.user;
  const { trainee_id, skill_id, score, notes } = req.body;

  if (!trainee_id || !skill_id || score === undefined) {
    return res.status(400).json({ error: 'trainee_id, skill_id, and score are required.' });
  }
  if (score < 1 || score > 7) {
    return res.status(400).json({ error: 'Score must be between 1 and 7.' });
  }

  const trainee = db.prepare('SELECT * FROM trainees WHERE id = ?').get(trainee_id);
  if (!trainee) return res.status(404).json({ error: 'Trainee not found.' });

  if (role === 'instructor' && trainee.instructor_id !== userId) {
    return res.status(403).json({ error: 'You can only evaluate your own trainees.' });
  }

  // Save the evaluation
  const id = uuidv4();
  db.prepare(`
    INSERT INTO skill_evaluations (id, trainee_id, skill_id, score, evaluated_by, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, trainee_id, skill_id, score, userId, notes || null);

  // Check if score triggers an alert
  const { alert, pass } = getThresholds();
  if (score <= alert) {
    db.prepare(`
      INSERT INTO notifications (id, trainee_id, skill_id, score)
      VALUES (?, ?, ?, ?)
    `).run(uuidv4(), trainee_id, skill_id, score);
  }

  res.status(201).json({
    id,
    message: 'Evaluation saved.',
    flagged: score <= alert,
    passed: score >= pass,
  });
});

module.exports = router;