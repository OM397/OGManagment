// 📁 /backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const tickersRoutes = require('./routes/tickersRoutes');
const User = require('./models/User');
const isAdmin = require('./middleware/isAdmin');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;
const MONGODB_URI = process.env.MONGODB_URI;

if (!JWT_SECRET || !MONGODB_URI) {
  throw new Error("❌ Faltan JWT_SECRET o MONGODB_URI en .env");
}

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ Conectado a MongoDB'))
  .catch(err => {
    console.error('❌ Error conectando a MongoDB:', err);
    process.exit(1);
  });

const allowedOrigins = [
  'http://localhost:5173',
  'https://amusing-intuition-production.up.railway.app',
  'https://ogmanagment-production.up.railway.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`❌ No permitido por CORS: ${origin}`));
    }
  },
  credentials: true
}));

app.use(cookieParser());
app.use(express.json());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Demasiados intentos. Intenta más tarde.' }
});

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,              // ✅ SIEMPRE seguro en producción
  sameSite: 'None',          // ✅ Para permitir cookies cross-origin
  maxAge: 60 * 60 * 1000
};

function authMiddleware(req, res, next) {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token faltante.' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Token inválido.' });
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

app.use('/api', tickersRoutes);

app.post('/api/register', authLimiter, async (req, res) => {
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

    res
      .cookie('token', token, COOKIE_OPTIONS)
      .status(201)
      .json({
        success: true,
        username: email,
        role,
        token
      });

  } catch (err) {
    res.status(500).json({ error: 'Error al registrar el usuario.' });
  }
});

app.post('/api/login', authLimiter, async (req, res) => {
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

    res
      .cookie('token', token, COOKIE_OPTIONS)
      .status(200)
      .json({
        success: true,
        username,
        role: user.role,
        token
      });

  } catch (err) {
    res.status(500).json({ error: 'Error del servidor.' });
  }
});

app.post('/api/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: true,
    sameSite: 'None'
  });
  res.status(200).json({ success: true });
});

app.get('/api/admin-only', authMiddleware, isAdmin, (req, res) => {
  res.json({ message: `👑 Bienvenido admin ${req.user.username}`, username: req.user.username });
});

app.get('/api/admin/users', authMiddleware, isAdmin, async (req, res) => {
  try {
    const users = await User.find({}, { username: 1, role: 1, approved: 1, createdAt: 1, lastLogin: 1 }).lean().sort({ createdAt: -1 });
    res.status(200).json({ users });
  } catch (err) {
    res.status(500).json({ error: 'No se pudieron cargar los usuarios.' });
  }
});

app.patch('/api/admin/users/:username/approve', authMiddleware, isAdmin, async (req, res) => {
  const { username } = req.params;
  if (username === 'admin') return res.status(403).json({ error: 'No se puede modificar el admin.' });

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
    if (user.approved) return res.status(400).json({ error: 'Este usuario ya fue aprobado.' });

    user.approved = true;
    await user.save();

    res.status(200).json({ success: true, approved: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al aprobar usuario.' });
  }
});

app.patch('/api/admin/users/:username/role', authMiddleware, isAdmin, async (req, res) => {
  const { username } = req.params;
  if (username === 'admin') return res.status(403).json({ error: 'No se puede cambiar el rol del usuario admin.' });

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

    const newRole = user.role === 'admin' ? 'user' : 'admin';
    await User.updateOne({ username }, { role: newRole });

    res.status(200).json({ success: true, role: newRole });
  } catch (err) {
    res.status(500).json({ error: 'Error actualizando rol.' });
  }
});

app.delete('/api/admin/users/:username', authMiddleware, isAdmin, async (req, res) => {
  const { username } = req.params;
  if (username === 'admin') return res.status(403).json({ error: 'No se puede eliminar el usuario admin.' });

  try {
    await User.deleteOne({ username });
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error eliminando usuario.' });
  }
});

app.get('/api/user-data', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

    const { password, ...safeData } = user.toObject();
    res.status(200).json({ data: safeData.data });
  } catch (err) {
    res.status(500).json({ error: 'Error al leer datos.' });
  }
});

app.post('/api/user-data', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

    if (!req.body?.data) return res.status(400).json({ error: 'Falta el objeto data.' });

    user.data = req.body.data;
    await user.save();

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'No se pudo guardar la data del usuario.' });
  }
});

app.get('/api/user', authMiddleware, (req, res) => {
  const { username, role } = req.user || {};
  if (!username || !role) {
    return res.status(401).json({ error: 'Token inválido' });
  }
  res.status(200).json({ username, role });
});

app.post('/api/change-password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword || newPassword.length < 5) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 5 caracteres.' });
  }

  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(401).json({ error: 'Contraseña actual incorrecta.' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ success: true, message: 'Contraseña actualizada correctamente.' });
  } catch (err) {
    res.status(500).json({ error: 'Error actualizando la contraseña.' });
  }
});

app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Backend server running at http://localhost:${PORT}`);
});
