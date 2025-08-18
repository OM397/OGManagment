// 📁 backend/routes/authRoutes.js

const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const User = require('../models/User');
const { authLimiter, refreshLimiter } = require('../middleware/rateLimiter');
const { sendEmail } = require('../utils/emailService');
const TokenService = require('../services/tokenService');
const ValidationMiddleware = require('../middleware/validation');

const router = express.Router();
const EXPOSE_ACCESS_TOKEN = ((process.env.EXPOSE_ACCESS_TOKEN || '').toLowerCase() === 'true');

// Host-only cookies (no domain) are more reliable on iOS/Safari/WebViews.
// In production use __Host- prefix (requires Secure + Path=/ and no Domain).
const IS_PROD = process.env.NODE_ENV === 'production';
const ACCESS_COOKIE_NAME = IS_PROD ? '__Host-accessToken' : 'accessToken';
const REFRESH_COOKIE_NAME = IS_PROD ? '__Host-refreshToken' : 'refreshToken';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: IS_PROD ? 'None' : 'Lax',
  path: '/'
  // Note: no domain on purpose (host-only)
};

const ACCESS_COOKIE_OPTIONS = {
  ...COOKIE_OPTIONS,
  maxAge: 15 * 60 * 1000, // 15 minutos
};

const REFRESH_COOKIE_OPTIONS = {
  ...COOKIE_OPTIONS,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const generatePassword = () =>
  crypto.randomBytes(6).toString('base64').slice(0, 10);

async function sendWelcomeEmail(to, password) {
  const subject = 'Bienvenido a CAP Tracker - Contraseña temporal';
  const html = `
    <p>Tu cuenta ha sido registrada correctamente.</p>
    <p><strong>Contraseña temporal:</strong> <code style="padding:4px 6px;background:#f4f4f5;border:1px solid #ddd;border-radius:4px;display:inline-block;letter-spacing:1px;">${password}</code></p>
    <p>Recomendación: inicia sesión y cámbiala pronto desde tu perfil.</p>
    <hr />
    <p style="font-size:12px;color:#666">Si no solicitaste esta cuenta puedes ignorar este correo.</p>
  `;
  const text = `Tu cuenta ha sido registrada correctamente.\nContraseña temporal: ${password}\nInicia sesión y cámbiala cuando quieras.`;
  return await sendEmail({ to, subject, html, text });
}

async function sendPasswordResetEmail(to, password) {
  const subject = 'Recuperación de contraseña - CAP Tracker';
  const html = `
    <p>Se ha generado una nueva contraseña temporal para tu cuenta.</p>
    <p><strong>Nueva contraseña temporal:</strong> <code style="padding:4px 6px;background:#f4f4f5;border:1px solid #ddd;border-radius:4px;display:inline-block;letter-spacing:1px;">${password}</code></p>
    <p>Puedes iniciar sesión con ella ahora mismo. Te recomendamos cambiarla pronto.</p>
    <hr />
    <p style="font-size:12px;color:#666">Si no solicitaste este cambio puedes ignorar este correo. La contraseña anterior ya no es válida.</p>
  `;
  const text = `Se ha generado una nueva contraseña temporal para tu cuenta. Nueva contraseña temporal: ${password}. Inicia sesión y cámbiala pronto.`;
  return await sendEmail({ to, subject, html, text });
}

// Notificación al admin ya no requerida porque auto-aprobamos
async function sendAdminNotification(newUserEmail) {
  return; // noop
}

router.post('/register', 
  authLimiter, 
  ValidationMiddleware.preventNoSQLInjection,
  ValidationMiddleware.validateRegister, 
  async (req, res) => {
    const { email } = req.body;

    try {
      const existing = await User.findOne({ username: email });
      if (existing) {
        // Uniform response to reduce enumeration
  // Opcional: reenviar correo de bienvenida si se desea (omitir para evitar abuso)
  return res.status(200).json({ success: true, alreadyExists: true });
      }

      const password = generatePassword();
      const hash = await bcrypt.hash(password, 12); // más seguro
      const newUser = new User({ username: email, password: hash, role: 'user', approved: true });
      await newUser.save();

      let emailSimulated = false;
      try {
        const sendResult = await sendWelcomeEmail(email, password);
        if (sendResult && sendResult.simulated) emailSimulated = true;
      } catch (e) {
  // ...existing code...
        if (process.env.NODE_ENV !== 'production') emailSimulated = true; // mostrar password si falla en dev
      }
      // Admin notification noop
      await sendAdminNotification(email);

      const autoLogin = (process.env.AUTO_LOGIN_ON_REGISTER || '').toLowerCase() === 'true';
      let body = { success: true, message: 'Usuario registrado. Revisa tu correo para la contraseña temporal.', uid: newUser.publicId };
      if (process.env.NODE_ENV !== 'production' && emailSimulated) {
        body.emailSimulated = true; // solo indicamos simulación, nunca la contraseña
      }
  // ...existing code...

      if (autoLogin) {
        // Generar par de tokens y establecer cookies sólo si se habilita explícitamente
        const { accessToken, refreshToken, tokenId } = TokenService.generateTokenPair({ uid: newUser.publicId, role: 'user' });
        const deviceInfo = { userAgent: req.headers['user-agent'], ip: req.ip || req.connection.remoteAddress };
  try { await TokenService.storeSession(newUser.publicId, tokenId, deviceInfo); } catch (e) { /* Error storeSession autoLogin */ }
        body = { ...body, role: 'user', tokenId, autoLogin: true };
        return res
          .cookie(ACCESS_COOKIE_NAME, accessToken, ACCESS_COOKIE_OPTIONS)
          .cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS)
          .status(201)
          .json(body);
      }

      // Asegurar que no queden cookies previas (si el navegador tenía sesión de otro usuario)
      res
        .clearCookie(ACCESS_COOKIE_NAME, COOKIE_OPTIONS)
        .clearCookie(REFRESH_COOKIE_NAME, COOKIE_OPTIONS)
        .status(201)
        .json(body);
    } catch (err) {
  // ...existing code...
      res.status(500).json({ error: 'Error al registrar el usuario.' });
    }
  });

// 💬 Recuperar / regenerar contraseña (flujo "Olvidé mi contraseña")
router.post('/forgot-password', authLimiter, ValidationMiddleware.preventNoSQLInjection, async (req, res) => {
  const { email } = req.body || {};
  if (!email || !isValidEmail(email)) {
    // Respuesta uniforme
    return res.status(200).json({ success: true, message: 'Si existe la cuenta, se enviará un correo.' });
  }
  try {
    const user = await User.findOne({ username: email.toLowerCase() });
    if (!user) {
      return res.status(200).json({ success: true, message: 'Si existe la cuenta, se enviará un correo.' });
    }
    // Generar nueva contraseña temporal y reemplazar
    const newPassword = generatePassword();
    const hash = await bcrypt.hash(newPassword, 12);
    user.password = hash;
    await user.save();
  try { await sendPasswordResetEmail(email, newPassword); } catch (e) { /* Error sendPasswordResetEmail */ }
    return res.status(200).json({ success: true, message: 'Si existe la cuenta, se enviará un correo.' });
  } catch (err) {
  // ...existing code...
    return res.status(200).json({ success: true, message: 'Si existe la cuenta, se enviará un correo.' });
  }
});

router.post('/login', 
  authLimiter, 
  ValidationMiddleware.preventNoSQLInjection,
  ValidationMiddleware.validateLogin, 
  async (req, res) => {
  const { username, password } = req.body;

  try {
  const user = await User.findOne({ username });
  if (!user) return res.status(401).json({ error: 'Credenciales inválidas.' });
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ error: 'Credenciales inválidas.' });
    
  // Bloqueo por aprobación eliminado (auto-aprobado)

    // Actualizar último login
    user.lastLogin = new Date();
    await user.save();

    // Generar par de tokens
    const { accessToken, refreshToken, tokenId } = TokenService.generateTokenPair({
      uid: user.publicId,
      role: user.role
    });

    // Almacenar información de sesión
    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress
    };
    try {
  await TokenService.storeSession(user.publicId, tokenId, deviceInfo);
    } catch (e) {
  // ...existing code...
    }

    const responseBody = { success: true, uid: user.publicId, role: user.role, tokenId, lastLogin: user.lastLogin };
    if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'production' || EXPOSE_ACCESS_TOKEN) {
      responseBody.accessToken = accessToken;
    }

    // Pre-limpieza agresiva: eliminar posibles cookies legacy para evitar colisiones (especialmente en iOS)
    // Esto asegura que solo queden activas las cookies recién emitidas.
    res
      .clearCookie('__Host-accessToken', COOKIE_OPTIONS)
      .clearCookie('__Host-refreshToken', COOKIE_OPTIONS)
      .clearCookie('accessToken', COOKIE_OPTIONS)
      .clearCookie('refreshToken', COOKIE_OPTIONS)
      .clearCookie('token', COOKIE_OPTIONS);

    return res
      .cookie(ACCESS_COOKIE_NAME, accessToken, ACCESS_COOKIE_OPTIONS)
      .cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS)
      .status(200)
      .json(responseBody);
  } catch (err) {
  // ...existing code...
    res.status(500).json({ error: 'Error del servidor.' });
  }
});

router.post('/logout', async (req, res) => {
  const refreshToken = req.cookies[REFRESH_COOKIE_NAME] || req.cookies.refreshToken || req.cookies['__Host-refreshToken'];
  
  try {
    if (refreshToken) {
      const decoded = await TokenService.verifyRefreshToken(refreshToken);
      // Revocar el token específico
      await TokenService.revokeToken(decoded.tokenId);
    }
  } catch (err) {
    // Si hay error al verificar, continuamos con logout de todas formas
  // ...existing code...
  }

  res
    .clearCookie(ACCESS_COOKIE_NAME, COOKIE_OPTIONS)
    .clearCookie(REFRESH_COOKIE_NAME, COOKIE_OPTIONS)
    .clearCookie('__Host-accessToken', COOKIE_OPTIONS)
    .clearCookie('__Host-refreshToken', COOKIE_OPTIONS)
    .clearCookie('accessToken', COOKIE_OPTIONS)
    .clearCookie('refreshToken', COOKIE_OPTIONS)
    .clearCookie('token', COOKIE_OPTIONS)
    .status(200)
    .json({ success: true, message: 'Sesión cerrada correctamente.' });
});

// 🔄 Renovar token de acceso usando refresh token
router.post('/refresh', refreshLimiter, async (req, res) => {
  // En producción, solo aceptamos la cookie host-only para evitar revivir sesiones legacy
  const refreshToken = IS_PROD
    ? (req.cookies[REFRESH_COOKIE_NAME] || null)
    : (req.cookies[REFRESH_COOKIE_NAME] || req.cookies.refreshToken || req.cookies['__Host-refreshToken']);

  if (!refreshToken) {
    return res.status(401).json({ 
      error: 'Refresh token faltante.',
      code: 'MISSING_REFRESH_TOKEN'
    });
  }

  try {
    const decoded = await TokenService.verifyRefreshToken(refreshToken);
    
    // Verificar que el usuario sigue existiendo y aprobado
  const user = await User.findOne({ publicId: decoded.uid });
  if (!user) {
      await TokenService.revokeToken(decoded.tokenId);
      return res.status(403).json({ 
        error: 'Usuario no autorizado.',
        code: 'USER_UNAUTHORIZED'
      });
    }

    // Generar nuevo par de tokens
  const { accessToken, refreshToken: newRefreshToken, tokenId } = TokenService.generateTokenPair({ uid: decoded.uid, role: decoded.role });

    // Revocar el token anterior
    try {
      await TokenService.revokeToken(decoded.tokenId);
    } catch (e) {
  // ...existing code...
    }

    // Almacenar nueva sesión
    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress
    };
    try {
  await TokenService.storeSession(decoded.uid, tokenId, deviceInfo);
    } catch (e) {
  // ...existing code...
    }

    res
      .cookie(ACCESS_COOKIE_NAME, accessToken, ACCESS_COOKIE_OPTIONS)
      .cookie(REFRESH_COOKIE_NAME, newRefreshToken, REFRESH_COOKIE_OPTIONS)
      .status(200)
      .json({
        success: true,
        message: 'Token renovado correctamente.',
        tokenId
      });
  } catch (err) {
  // ...existing code...
    res
      .clearCookie(ACCESS_COOKIE_NAME, COOKIE_OPTIONS)
      .clearCookie(REFRESH_COOKIE_NAME, COOKIE_OPTIONS)
      .clearCookie('__Host-accessToken', COOKIE_OPTIONS)
      .clearCookie('__Host-refreshToken', COOKIE_OPTIONS)
      .clearCookie('accessToken', COOKIE_OPTIONS)
      .clearCookie('refreshToken', COOKIE_OPTIONS)
      .clearCookie('token', COOKIE_OPTIONS)
      .status(401)
      .json({ 
        error: 'Refresh token inválido: ' + err.message,
        code: err?.name === 'TokenExpiredError' ? 'REFRESH_TOKEN_EXPIRED' : 'INVALID_REFRESH_TOKEN'
      });
  }
});

// 📱 Obtener sesiones activas del usuario
router.get('/sessions', async (req, res) => {
  const refreshToken = req.cookies[REFRESH_COOKIE_NAME] || req.cookies.refreshToken || req.cookies['__Host-refreshToken'];

  if (!refreshToken) {
    return res.status(401).json({ error: 'No autenticado.' });
  }

  try {
    const decoded = await TokenService.verifyRefreshToken(refreshToken);
  const sessions = await TokenService.getUserSessions(decoded.uid);
    
    res.status(200).json({
      success: true,
      sessions: sessions.map(session => ({
        sessionId: session.sessionId,
        createdAt: session.createdAt,
        lastAccess: session.lastAccess,
        userAgent: session.userAgent,
        ip: session.ip,
        isCurrent: session.tokenId === decoded.tokenId
      }))
    });
  } catch (err) {
    res
      .clearCookie(ACCESS_COOKIE_NAME, COOKIE_OPTIONS)
      .clearCookie(REFRESH_COOKIE_NAME, COOKIE_OPTIONS)
      .clearCookie('__Host-accessToken', COOKIE_OPTIONS)
      .clearCookie('__Host-refreshToken', COOKIE_OPTIONS)
      .clearCookie('accessToken', COOKIE_OPTIONS)
      .clearCookie('refreshToken', COOKIE_OPTIONS)
      .clearCookie('token', COOKIE_OPTIONS)
      .status(401)
      .json({ error: 'Token inválido.' });
  }
});

// 🚫 Cerrar sesión específica
router.delete('/sessions/:sessionId', async (req, res) => {
  const refreshToken = req.cookies[REFRESH_COOKIE_NAME] || req.cookies.refreshToken || req.cookies['__Host-refreshToken'];
  const { sessionId } = req.params;

  if (!refreshToken) {
    return res.status(401).json({ error: 'No autenticado.' });
  }

  try {
    const decoded = await TokenService.verifyRefreshToken(refreshToken);
    try {
      await TokenService.revokeToken(sessionId);
    } catch (e) {
  // ...existing code...
    }
    
    res.status(200).json({
      success: true,
      message: 'Sesión cerrada correctamente.'
    });
  } catch (err) {
    res.status(401).json({ error: 'Token inválido.' });
  }
});

// 🚫 Cerrar todas las sesiones
router.post('/logout-all', async (req, res) => {
  const refreshToken = req.cookies[REFRESH_COOKIE_NAME] || req.cookies.refreshToken || req.cookies['__Host-refreshToken'];

  if (!refreshToken) {
    return res.status(401).json({ error: 'No autenticado.' });
  }

  try {
    const decoded = await TokenService.verifyRefreshToken(refreshToken);
    try {
  await TokenService.revokeAllUserTokens(decoded.uid);
    } catch (e) {
  // ...existing code...
    }
    
    res
      .clearCookie(ACCESS_COOKIE_NAME, COOKIE_OPTIONS)
      .clearCookie(REFRESH_COOKIE_NAME, COOKIE_OPTIONS)
      .clearCookie('__Host-accessToken', COOKIE_OPTIONS)
      .clearCookie('__Host-refreshToken', COOKIE_OPTIONS)
      .clearCookie('accessToken', COOKIE_OPTIONS)
      .clearCookie('refreshToken', COOKIE_OPTIONS)
      .clearCookie('token', COOKIE_OPTIONS)
      .status(200)
      .json({
        success: true,
        message: 'Todas las sesiones han sido cerradas.'
      });
  } catch (err) {
    res
      .clearCookie(ACCESS_COOKIE_NAME, COOKIE_OPTIONS)
      .clearCookie(REFRESH_COOKIE_NAME, COOKIE_OPTIONS)
      .clearCookie('__Host-accessToken', COOKIE_OPTIONS)
      .clearCookie('__Host-refreshToken', COOKIE_OPTIONS)
      .clearCookie('accessToken', COOKIE_OPTIONS)
      .clearCookie('refreshToken', COOKIE_OPTIONS)
      .clearCookie('token', COOKIE_OPTIONS)
      .status(401)
      .json({ error: 'Token inválido.' });
  }
});

module.exports = router;
