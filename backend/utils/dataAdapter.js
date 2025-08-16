// 📁 backend/utils/dataAdapter.js
// Adaptador y normalizador de datos para respuestas de APIs externas

function toISODate(date) {
  if (!date) return null;
  if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}/)) return date;
  if (date instanceof Date) return date.toISOString().split('T')[0];
  if (typeof date === 'number') return new Date(date * 1000).toISOString().split('T')[0];
  return null;
}

function normalizePriceResponse({ price, currency, date, marketCap, source, fetchedAt, provider }) {
  return {
    price: typeof price === 'string' ? parseFloat(price) : price,
    currency: currency ? currency.toUpperCase() : 'EUR',
    date: toISODate(date) || null,
    marketCap: marketCap !== undefined ? marketCap : null,
    source: source || 'live',
    fetchedAt: fetchedAt || new Date().toISOString(),
    meta: { provider: provider || null }
  };
}

function normalizeHistoryResponse({ history, currency, source, fetchedAt, provider }) {
  return {
    history: Array.isArray(history)
      ? history.map(p => ({
          date: toISODate(p.date),
          price: typeof p.price === 'string' ? parseFloat(p.price) : p.price
        }))
      : [],
    currency: currency ? currency.toUpperCase() : 'EUR',
    source: source || 'live',
    fetchedAt: fetchedAt || new Date().toISOString(),
    meta: { provider: provider || null }
  };
}

function normalizePerformanceResponse({ changes, sources, fetchedAt, provider }) {
  return {
    changes: changes || {},
    sources: sources || {},
    fetchedAt: fetchedAt || new Date().toISOString(),
    meta: { provider: provider || null }
  };
}

module.exports = {
  normalizePriceResponse,
  normalizeHistoryResponse,
  normalizePerformanceResponse,
  toISODate
};
