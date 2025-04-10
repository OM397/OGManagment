// refresh-tickers.js
const fs = require('fs');
const axios = require('axios');
const path = require('path');

const COINGECKO_URL = 'https://api.coingecko.com/api/v3/coins/list';
const OUTPUT_PATH = path.join(__dirname, 'coingecko-tickers.json');

async function fetchCoinGeckoTickers() {
  try {
    const { data } = await axios.get(COINGECKO_URL);
    const simplified = data.map(coin => ({ id: coin.id, symbol: coin.symbol, name: coin.name }));
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(simplified, null, 2));
    console.log(`✅ CoinGecko tickers updated (${simplified.length} entries)`);
  } catch (err) {
    console.error('❌ Failed to fetch CoinGecko tickers:', err.message);
  }
}

fetchCoinGeckoTickers();
