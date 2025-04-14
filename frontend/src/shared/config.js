// 📁 frontend/src/shared/config.js

export const CATEGORIES = ['Investments', 'Real Estate', 'Others'];

export const API_BASE = import.meta.env.PROD
  ? 'https://ogmanagment-production.up.railway.app/api'
  : 'http://localhost:3001/api';
