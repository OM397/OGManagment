// 📁 backend/alias-require.js
const path = require('path');

// Alias dinámico para permitir imports según entorno
const fromRoot = (...segments) => {
  return path.join(__dirname, ...segments);
};

const isProduction = process.env.NODE_ENV === 'production';

const resolvePath = (subpath) => {
  return isProduction
    ? fromRoot('backend', subpath)
    : fromRoot(subpath);
};

module.exports = {
  requireRoute: (file) => require(resolvePath(`routes/${file}`)),
  requireMiddleware: (file) => require(resolvePath(`middleware/${file}`))
};
