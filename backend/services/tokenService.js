// 📁 backend/services/tokenService.js
const jwt = require('jsonwebtoken');
const redis = require('../redisClient');

const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TTL_SEC = 15 * 60; // 15m
const REFRESH_TTL_SEC = 7 * 24 * 60 * 60; // 7d

function generateTokenPair(payload) {
	// payload must contain { uid, role }
	const tokenId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
	const base = { uid: payload.uid, role: payload.role, tokenId };
	const accessToken = jwt.sign(base, JWT_SECRET, { expiresIn: '15m' });
	const refreshToken = jwt.sign(base, JWT_SECRET, { expiresIn: '7d' });
	return { accessToken, refreshToken, tokenId };
}

async function storeSession(uid, tokenId, deviceInfo = {}) {
	const key = `session:${uid}:${tokenId}`;
	await redis.hmset(key, {
		userAgent: deviceInfo.userAgent || '',
		ip: deviceInfo.ip || '',
		createdAt: Date.now().toString(),
		lastAccess: Date.now().toString(),
	});
	await redis.expire(key, REFRESH_TTL_SEC);
}

async function updateSessionActivity(uid, tokenId) {
	const key = `session:${uid}:${tokenId}`;
	await redis.hset(key, 'lastAccess', Date.now().toString());
}

async function revokeToken(tokenId) {
	const pattern = `session:*:${tokenId}`;
	const keys = await redis.keys(pattern);
	if (keys.length) await redis.del(keys);
}

async function revokeAllUserTokens(uid) {
	const pattern = `session:${uid}:*`;
	const keys = await redis.keys(pattern);
	if (keys.length) await redis.del(keys);
}

async function getUserSessions(uid) {
	const pattern = `session:${uid}:*`;
	const keys = await redis.keys(pattern);
	const sessions = [];
	for (const key of keys) {
		const data = await redis.hgetall(key);
		const tokenId = key.split(':').pop();
		sessions.push({ sessionId: tokenId, ...data, tokenId });
	}
	return sessions;
}

async function verifyAccessToken(token) {
	return jwt.verify(token, JWT_SECRET);
}

async function verifyRefreshToken(token) {
	return jwt.verify(token, JWT_SECRET);
}

module.exports = {
	generateTokenPair,
	storeSession,
	updateSessionActivity,
	revokeToken,
	revokeAllUserTokens,
	getUserSessions,
	verifyAccessToken,
	verifyRefreshToken
};
