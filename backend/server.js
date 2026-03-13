const express = require('express');
const cors = require('cors');
const session = require('express-session');
const authRoutes = require('./routes/auth');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    maxAge: 1000 * 60 * 60 * 8 // 8 hours
  }
}));

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'EMS Tracker API is running!' });
});

app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`🚑 EMS Tracker running on http://localhost:${PORT}`);
});