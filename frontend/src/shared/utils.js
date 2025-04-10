// === utils.js ===
export const formatter = {
  format(value) {
    const formatted = new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
    return `€ ${formatted}`;
  }
};
 





export function getAdjustedValues(title, value, exchangeRates) {
  const parts = title.split('.');
  const currency = parts.length > 1 ? parts[1] : 'EUR';
  const exchangeRate = exchangeRates[currency] || 1;
  return {
    adjustedCurrent: value,
    exchangeRate
  };
}







export function mapCryptoSymbols(symbol) {
  const mapping = {
    BTC: 'bitcoin',
    ETH: 'ethereum'
  };
  return mapping[symbol.toUpperCase()] || null;
}
// === utils.js ===
