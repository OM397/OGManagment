// 📁 frontend/src/shared/config.js

export const CATEGORIES = ['Investments', 'Real Estate', 'Others'];

export const API_BASE = import.meta.env.MODE === 'production'
  ? import.meta.env.API_BASE
  : 'http://localhost:3001/api';
