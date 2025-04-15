// 📁 /backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const isRailway = process.env.RAILWAY_ENV === 'production' || process.env.NODE_ENV === 'production';
const routesBase = isRailway ? './routes' : './backend/routes';
const middlewareBase = isRailway ? './middleware' : './backend/middleware';

const tickersRoutes = require(`${routesBase}/tickersRoutes`);
const authRoutes = require(`${routesBase}/authRoutes`);
const adminRoutes = require(`${routesBase}/adminRoutes`);
const userRoutes = require(`${routesBase}/userRoutes`);
const authMiddleware = require(`${middlewareBase}/authMiddleware`);

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
  'https://ogmanagment-production-f730.up.railway.app'
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

// ✅ Rutas principales
app.use('/api', tickersRoutes);
app.use('/api', authRoutes);   // login, register, logout

// ✅ Rutas protegidas
app.use('/api', userRoutes);   // user, user-data, change-password
app.use('/api', adminRoutes);  // admin-only, admin/users

// ✅ SPA fallback
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
console.log("Serving frontend from:", path.join(__dirname, 'public', 'index.html'));

app.listen(PORT, () => {
  console.log(`✅ Backend server running at http://localhost:${PORT}`);
});
