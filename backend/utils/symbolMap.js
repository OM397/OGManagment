// 📁 backend/utils/symbolMap.js

/**
 * Dynamically normalize symbol ID per API rules
 * @param {string} id - Raw symbol (e.g., 'BTC', 'AAPL')
 * @param {string} type - 'stock' | 'crypto'
 * @param {string} api - 'yahoo' | 'finnhub' | 'twelve'
 * @returns {string|null} - Translated symbol for the API
 */
function getIdForApi(id, type, api) {
    const upperId = id.toUpperCase();
  
    if (type === 'crypto') {
      switch (api) {
        case 'yahoo':
          return `${upperId}-EUR`;
        case 'finnhub':
          return `BINANCE:${upperId}USDT`;
        case 'twelve':
          return `${upperId}/USD`;
        default:
          return null;
      }
    }
  
    if (type === 'stock') {
      switch (api) {
        case 'yahoo':
        case 'finnhub':
        case 'twelve':
          return upperId;
        default:
          return null;
      }
    }
  
    return null;
  }
  
  module.exports = {
    getIdForApi
  };
  