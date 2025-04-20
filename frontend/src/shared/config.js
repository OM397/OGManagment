// 📁 frontend/src/shared/config.js

export const CATEGORIES = ['Investments', 'Real Estate', 'Others'];

export const API_BASE = typeof __API_BASE__ !== 'undefined'
  ? __API_BASE__
  : 'http://localhost:3001/api'; // fallback local

console.log("🔧 API_BASE =", API_BASE); // (opcional para debug)
