// Require a logged in session
function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Not authenticated. Please log in.' });
  }
  next();
}

// Require specific roles
// Usage: requireRole('admin') or requireRole('admin', 'instructor')
function requireRole(...roles) {
  return [
    requireAuth,
    (req, res, next) => {
      if (!roles.includes(req.session.user.role)) {
        return res.status(403).json({ error: 'Access denied.' });
      }
      next();
    },
  ];
}

module.exports = { requireAuth, requireRole };
