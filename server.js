// 📁 /server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const tickersRoutes = require('./backend/routes/tickersRoutes');
const User = require('./backend/models/User');

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

app.use(cors());
app.use(express.json());

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token faltante.' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded.username;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Token inválido.' });
  }
}

app.use('/api', tickersRoutes);

app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password || username.length < 3 || password.length < 5) {
    return res.status(400).json({ error: 'Credenciales inválidas.' });
  }

  try {
    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(409).json({ error: 'Usuario ya existe.' });
    }

    const hash = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hash });
    await newUser.save();

    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ success: true, token, username });
  } catch (err) {
    console.error("Error registrando usuario", username, err);
    res.status(500).json({ error: 'Error al registrar el usuario.' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

//    const isMatch = await bcrypt.compare(password, user.password);
  //  if (!isMatch) return res.status(401).json({ error: 'Contraseña incorrecta.' });

    const isMatch = await bcrypt.compare(password, user.password);
console.log(`🧪 Login intento: username=${username}, pass=${password}`);
console.log(`🔑 DB hash=${user.password}`);
console.log(`🔐 Comparación bcrypt: ${isMatch}`);

if (!isMatch) return res.status(401).json({ error: 'Contraseña incorrecta.' });




    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ success: true, token, username });
  } catch (err) {
    console.error("Error validando login:", err);
    res.status(500).json({ error: 'Error del servidor.' });
  }
});

app.get('/api/user-data', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

    const { password, ...safeData } = user.toObject();
    res.json(safeData.data);
  } catch (err) {
    res.status(500).json({ error: 'Error al leer datos.' });
  }
});

app.post('/api/user-data', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

    user.data = req.body;
    await user.save();
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'No se pudo guardar la data del usuario.' });
  }
});

const path = require('path');

// 👉 Sirve archivos estáticos desde el frontend
app.use(express.static(path.join(__dirname, 'public')));

// 👉 Para rutas que no son API, retorna el index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});



app.listen(PORT, () => {
  console.log(`✅ Backend server running at http://localhost:${PORT}`);
});
