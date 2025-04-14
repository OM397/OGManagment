// 📁 frontend/src/shared/config.js

export const CATEGORIES = ['Investments', 'Real Estate', 'Others'];

// Detecta si estamos en producción
const isProduction = import.meta.env.PROD;

// Usa la URL local o la del backend en Railway
export const API_BASE = isProduction
  ? 'https://ogmanagment-production.up.railway.app/api' // tu backend en Railway
  : 'http://localhost:3001/api';
