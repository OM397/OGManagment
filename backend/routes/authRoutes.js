// 📁 backend/routes/authRoutes.js

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const rateLimiter = require('../middleware/rateLimiter');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'None',
  maxAge: 60 * 60 * 1000,
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const generatePassword = () => {
  return crypto.randomBytes(6).toString('base64').slice(0, 10);
};

const createTransporter = () =>
  nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASS,
    },
  });

const sendWelcomeEmail = async (to, password) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"CAP Tracker" <${process.env.SMTP_EMAIL}>`,
    to,
    subject: 'Bienvenido a CAP Tracker 🚀',
    text: `Tu cuenta ha sido registrada correctamente.\n\nContraseña temporal: ${password}\n\n¡Inicia sesión y cámbiala cuando quieras!`,
    html: `
      <p>Tu cuenta ha sido registrada correctamente.</p>
      <p><strong>Contraseña temporal:</strong> ${password}</p>
      <p>¡Inicia sesión y cámbiala cuando quieras!</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendAdminNotification = async (newUserEmail) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"CAP Tracker" <${process.env.SMTP_EMAIL}>`,
    to: process.env.ADMIN_EMAIL,
    subject: '📩 Nuevo usuario registrado en CAP Tracker',
    html: `
      <h3>Nuevo registro pendiente</h3>
      <p>El siguiente usuario ha solicitado acceso:</p>
      <ul>
        <li><strong>Email:</strong> ${newUserEmail}</li>
      </ul>
      <p>Por favor, revisa y aprueba desde el panel de administración.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

router.post('/register', rateLimiter, async (req, res) => {
  const { email } = req.body;

  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ error: 'Correo electrónico inválido.' });
  }

  try {
    const existing = await User.findOne({ username: email });
    if (existing) return res.status(409).json({ error: 'Usuario ya existe.' });

    const password = generatePassword();
    const hash = await bcrypt.hash(password, 10);
    const newUser = new User({ username: email, password: hash, role: 'user' });

    await newUser.save();

    await sendWelcomeEmail(email, password);
    await sendAdminNotification(email);

    const token = jwt.sign({ username: email, role: 'user' }, JWT_SECRET, { expiresIn: '1h' });

    res.cookie('token', token, COOKIE_OPTIONS).status(201).json({
      success: true,
      username: email,
      role: 'user',
      token,
    });
  } catch (err) {
    console.error('[REGISTER]', err);
    res.status(500).json({ error: 'Error al registrar el usuario.' });
  }
});

router.post('/login', rateLimiter, async (req, res) => {
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
      token,
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
