// 📁 /backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// ✅ Robust require for Redis client (resolves correctly in prod)
require('./redisClient');


const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;
const MONGODB_URI = process.env.MONGODB_URI;

if (!JWT_SECRET || !MONGODB_URI) {
  throw new Error("❌ Faltan JWT_SECRET o MONGODB_URI en .env");
}

const baseDir = __dirname.includes('backend') ? './routes' : './backend/routes';
const middlewareBase = __dirname.includes('backend') ? './middleware' : './backend/middleware';

const tickersRoutes = require(path.join(__dirname, baseDir, 'tickersRoutes.js'));
const authRoutes = require(path.join(__dirname, baseDir, 'authRoutes.js'));
const adminRoutes = require(path.join(__dirname, baseDir, 'adminRoutes.js'));
const userRoutes = require(path.join(__dirname, baseDir, 'userRoutes.js'));
const tickersHistoryRoutes = require(path.join(__dirname, baseDir, 'tickersHistoryRoutes.js'));
const authMiddleware = require(path.join(__dirname, middlewareBase, 'authMiddleware.js'));

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
  'https://ogmanagment-production-f730.up.railway.app',
  'https://www.capitaltracker.app'
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

app.use('/api', tickersRoutes);
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', adminRoutes);
app.use('/api', tickersHistoryRoutes);

app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
console.log("Serving frontend from:", path.join(__dirname, 'public', 'index.html'));

app.listen(PORT, () => {
  console.log(`✅ Backend server running at http://localhost:${PORT}`);
});
