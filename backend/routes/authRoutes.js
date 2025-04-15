// 📁 backend/routes/authRoutes.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const User = require('../models/User');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'None',
  maxAge: 60 * 60 * 1000
};

// ✅ SOLO para login y register
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Demasiados intentos. Intenta más tarde.' }
});

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.post('/register', authLimiter, async (req, res) => {
  const { email, password, role = 'user' } = req.body;

  if (!email || !password || password.length < 5 || !isValidEmail(email)) {
    return res.status(400).json({ error: 'Email inválido o contraseña muy corta.' });
  }

  try {
    const existing = await User.findOne({ username: email });
    if (existing) return res.status(409).json({ error: 'Usuario ya existe.' });

    const hash = await bcrypt.hash(password, 10);
    const newUser = new User({ username: email, password: hash, role });
    await newUser.save();

    const token = jwt.sign({ username: email, role }, JWT_SECRET, { expiresIn: '1h' });

    res.cookie('token', token, COOKIE_OPTIONS).status(201).json({
      success: true,
      username: email,
      role,
      token
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al registrar el usuario.' });
  }
});

router.post('/login', authLimiter, async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Contraseña incorrecta.' });
    if (!user.approved) return res.status(403).json({ error: 'Tu cuenta aún no ha sido aprobada por el administrador.' });

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign({ username, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

    res.cookie('token', token, COOKIE_OPTIONS).status(200).json({
      success: true,
      username,
      role: user.role,
      token
    });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor.' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', COOKIE_OPTIONS);
  res.status(200).json({ success: true });
});

module.exports = router;
