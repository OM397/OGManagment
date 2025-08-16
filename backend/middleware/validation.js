// 📁 backend/middleware/validation.js
const validator = require('validator');

// Basic sanitization to avoid MongoDB operator injection in JSON bodies/queries
function sanitize(obj) {
	if (!obj || typeof obj !== 'object') return obj;
	for (const key of Object.keys(obj)) {
		if (key.startsWith('$') || key.includes('.')) {
			const safeKey = key.replace(/^[.$]+/g, '').replace(/[.]/g, '_');
			obj[safeKey] = obj[key];
			delete obj[key];
		}
		if (typeof obj[key] === 'object') sanitize(obj[key]);
	}
	return obj;
}

const ValidationMiddleware = {
	preventNoSQLInjection: (req, _res, next) => {
		if (req.body) req.body = sanitize(req.body);
		if (req.query) req.query = sanitize(req.query);
		next();
	},

	sanitizeQuery: (_req, _res, next) => next(),

	validateLogin: (req, res, next) => {
		const { username, password } = req.body || {};
		if (!username || !password) {
			return res.status(400).json({ error: 'Faltan credenciales.' });
		}
		if (!validator.isEmail(username)) {
			return res.status(400).json({ error: 'Email inválido.' });
		}
		if (typeof password !== 'string' || password.length < 3) {
			return res.status(400).json({ error: 'Contraseña inválida.' });
		}
		next();
	},

	validateRegister: (req, res, next) => {
		const { email } = req.body || {};
		if (!email || !validator.isEmail(email)) {
			return res.status(400).json({ error: 'Email inválido.' });
		}
		next();
	}
};

module.exports = ValidationMiddleware;
