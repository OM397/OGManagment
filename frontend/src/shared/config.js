// 📁 frontend/src/shared/config.js

export const CATEGORIES = ['Investments', 'Real Estate', 'Others'];

// Prefer Vite proxy in dev so cookies (httpOnly) work: app runs on 5173 → proxy to 3001
const onLocalhost = typeof window !== 'undefined' && window.location?.hostname === 'localhost';
export const API_BASE = typeof __API_BASE__ !== 'undefined'
  ? __API_BASE__
  : (onLocalhost ? '/api' : 'http://localhost:3001/api');

// ...existing code...
