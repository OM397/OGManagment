// 📁 backend/utils/symbolMap.js

/**
 * Dynamically normalize symbol ID per API rules
 * @param {string} id - Raw symbol (e.g., 'BTC', 'AAPL')
 * @param {string} type - 'stock' | 'crypto'
 * @param {string} api - 'yahoo' | 'finnhub' | 'twelve'
 * @returns {string|null} - Translated symbol for the API
 */
const ID_TO_SYMBOL = {
  bitcoin: 'BTC',
  ethereum: 'ETH',
  ripple: 'XRP',
  solana: 'SOL',
  cardano: 'ADA',
  dogecoin: 'DOGE',
  polkadot: 'DOT',
  tron: 'TRX',
  litecoin: 'LTC',
  chainlink: 'LINK',
  avalanche: 'AVAX',
  'avalanche-2': 'AVAX',
  stellar: 'XLM',
  monero: 'XMR',
  uniswap: 'UNI',
  cosmos: 'ATOM',
  near: 'NEAR',
  'official-trump': 'TRUMP',
  'pepe': 'PEPE',
  binancecoin: 'BNB'
};

function resolveCryptoSymbol(id) {
  if (!id) return null;
  const lower = id.toLowerCase();
  if (ID_TO_SYMBOL[lower]) return ID_TO_SYMBOL[lower];
  // Heuristic: if user already provided short ticker style (<=6 chars, no dash) use it
  if (/^[a-z0-9]{2,6}$/i.test(id) && !lower.includes('-')) return id.toUpperCase();
  return null; // Unknown mapping
}

function getIdForApi(id, type, api) {
  const upperId = id?.toUpperCase?.() || '';

  if (type === 'crypto') {
    const sym = resolveCryptoSymbol(id) || upperId; // fall back to raw upper id (may fail but logged upstream)
    switch (api) {
      case 'yahoo':
        return `${sym}-EUR`;
      case 'finnhub':
        return `BINANCE:${sym}USDT`;
      case 'twelve':
        return `${sym}/USD`;
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
  getIdForApi,
  resolveCryptoSymbol,
  ID_TO_SYMBOL
};
  