// 📁 /backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const helmet = require('helmet');
const { apiLimiter } = require('./middleware/rateLimiter');
const fs = require('fs');
require('dotenv').config();
require(path.resolve(__dirname, 'redisClient'));

const redisClient = require('./redisClient');




const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;
const MONGODB_URI = process.env.MONGODB_URI;

if (!JWT_SECRET || !MONGODB_URI) {
  throw new Error("❌ Faltan JWT_SECRET o MONGODB_URI en .env");
}

// Detrás de un proxy (Railway/NGINX), habilitar para que cookies Secure/SameSite funcionen
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

const baseDir = './routes';           // ✅ Always from root of /app
const middlewareBase = './middleware';



const tickersRoutes = require(path.join(__dirname, baseDir, 'tickersRoutes.js'));
const authRoutes = require(path.join(__dirname, baseDir, 'authRoutes.js'));
const adminRoutes = require(path.join(__dirname, baseDir, 'adminRoutes.js'));
const userRoutes = require(path.join(__dirname, baseDir, 'userRoutes.js'));
const tickersHistoryRoutes = require(path.join(__dirname, baseDir, 'tickersHistoryRoutes.js'));
const investmentAnalysisRoutes = require(path.join(__dirname, baseDir, 'investmentAnalysisRoutes.js'));
const mailingConfigRoutes = require(path.join(__dirname, baseDir, 'mailingConfigRoutes.js'));
const adminMailingRoutes = require(path.join(__dirname, baseDir, 'adminMailingRoutes.js'));
const performanceRoutes = require(path.join(__dirname, baseDir, 'performanceRoutes.js'));

// Note: authMiddleware is applied within specific route modules; no need to import here

// Simple in-memory metrics counters (reset on process restart)
const metrics = {
  startTime: Date.now(),
  requestsTotal: 0,
  requestsByRoute: {},
  lastRequestTs: null
};

app.use((req, res, next) => {
  metrics.requestsTotal++;
  metrics.lastRequestTs = Date.now();
  const key = req.method + ' ' + (req.path.split('?')[0]);
  metrics.requestsByRoute[key] = (metrics.requestsByRoute[key] || 0) + 1;
  next();
});

// Iniciar el scheduler de mailing semanal
const { scheduleMailingJob, watchMailingConfig } = require('./mailingScheduler');
mongoose.connection.once('open', async () => {
  await scheduleMailingJob();
  watchMailingConfig();
});

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
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://localhost:3000',
  'https://ogmanagment-production-f730.up.railway.app',
  'https://www.capitaltracker.app',
  'https://capitaltracker.app'
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

// Seguridad HTTP
if (process.env.NODE_ENV === 'production') {
  // Content Security Policy (minimal allowlist, adjust if you add external CDNs)
  app.use(helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
  // Allow Google Identity Services script and related network/frames
  scriptSrc: ["'self'", 'https://accounts.google.com'],
  // GIS renderButton uses inline styles; allow only for styles
  styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
      fontSrc: ["'self'", 'data:'],
  connectSrc: ["'self'", 'https://accounts.google.com'],
      objectSrc: ["'none'"],
      baseUri: ["'none'"],
  frameAncestors: ["'none'"],
  frameSrc: ["'self'", 'https://accounts.google.com']
    }
  }));
  // HSTS
  app.use(helmet.hsts({
    maxAge: 15552000, // 180 days
    includeSubDomains: true,
    preload: true
  }));
} else {
  // In dev keep defaults without CSP to reduce friction
  app.use(helmet());
}

// Referrer-Policy and a conservative Permissions-Policy
app.use(helmet.referrerPolicy({ policy: 'no-referrer' }));
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=()');
  next();
});

// Rate limiting global de API
// El apiLimiter se aplica a todo, y los limitadores más específicos
// (authLimiter, etc.) se aplican dentro de sus respectivos archivos de rutas.
// La nueva configuración con Redis Store asegura que funcionen correctamente.
app.use('/api', apiLimiter);

// ✅ Explicit public /api/history route (defensive: ensure no auth middleware intercepts)
const tickersHistoryController = require('./controllers/tickersHistoryController');
app.get('/api/history', (req, res, next) => {
  res.set('Cache-Control', 'public, max-age=60');
  next();
}, tickersHistoryController.getHistoricalData);


// Public lightweight data routes first (avoid accidental auth interception)
app.use('/api', performanceRoutes);
app.use('/api', tickersRoutes);
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', adminRoutes);
app.use('/api/investments', investmentAnalysisRoutes);
app.use('/api', tickersHistoryRoutes);
app.use('/api/mailing-config', mailingConfigRoutes);
app.use('/api/admin', adminMailingRoutes);
// performance already mounted early

// 🔍 Debug endpoint
app.get('/api/ping', (req, res) => res.json({ ok: true, ts: Date.now() }));
// Basic metrics (JSON). For Prometheus you can adapt formatting.
app.get('/api/metrics', (req, res) => {
  res.json({
    uptimeSeconds: Math.round((Date.now() - metrics.startTime)/1000),
    requestsTotal: metrics.requestsTotal,
    lastRequestTs: metrics.lastRequestTs,
    routes: metrics.requestsByRoute,
    schedulerEnabled: !process.env.RUN_SCHEDULER || !['false','0','no'].includes(process.env.RUN_SCHEDULER.toLowerCase())
  });
});
// Build info endpoint (commit hash + build time) - file is templated during deploy
app.get('/api/build-info', (req, res) => {
  const filePath = path.join(__dirname, 'build-info.json');
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(raw);
      return res.json({
        commit: data.commit || null,
        builtAt: data.builtAt || null,
        runtime: new Date().toISOString()
      });
    }
  } catch (e) {
    return res.status(500).json({ error: 'build-info read error', message: e.message });
  }
  res.json({ commit: null, builtAt: null, runtime: new Date().toISOString() });
});

app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
console.log("Serving frontend from:", path.join(__dirname, 'public', 'index.html'));

let serverInstance = null;
if (process.env.NODE_ENV !== 'test') {
  serverInstance = app.listen(PORT, () => {
    console.log(`✅ Backend server running at http://localhost:${PORT}`);
  });
}

// Test de Redis al iniciar el servidor
redisClient.set('test_key', 'test_value', (err) => {
  if (err) {
    console.error('❌ Error escribiendo en Redis:', err);
  } else {
    redisClient.get('test_key', (err, value) => {
      if (err) {
        console.error('❌ Error leyendo de Redis:', err);
      } else {
        console.log('✅ Redis test value:', value); // Debería mostrar 'test_value'
      }
    });
  }
});

async function gracefulShutdown(signal) {
  console.log(`\n⚠️  Received ${signal}, shutting down gracefully...`);
  try {
    serverInstance && serverInstance.close(() => console.log('HTTP server closed.'));
    await mongoose.connection.close();
    console.log('Mongo connection closed.');
    try { const redis = require('./redisClient'); if (redis?.quit) await redis.quit(); } catch {}
  } catch (e) {
    console.error('Error during shutdown:', e.message);
  } finally {
    process.exit(0);
  }
}

['SIGINT','SIGTERM'].forEach(sig => process.on(sig, () => gracefulShutdown(sig)));

module.exports = app;
