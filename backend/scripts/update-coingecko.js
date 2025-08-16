// Script: update-coingecko.js
// Purpose: Fetch latest CoinGecko tickers list and store compact json used by unifiedMarketDataService fallback.
// Run: npm run tickers:update

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const COINGECKO_URL = 'https://api.coingecko.com/api/v3/coins/list';
const OUTPUT_PATH = path.join(__dirname, '..', 'coingecko-tickers.json');

async function main(){
  console.log('⬇️  Fetching CoinGecko tickers...');
  try {
    const { data } = await axios.get(COINGECKO_URL, { timeout: 30000 });
    if(!Array.isArray(data) || !data.length){
      throw new Error('Empty tickers response');
    }
    const simplified = data.map(c => ({ id: c.id, symbol: c.symbol, name: c.name }));
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(simplified, null, 2));
    console.log(`✅ Saved ${simplified.length} tickers to`, OUTPUT_PATH);
  } catch (e) {
    console.error('❌ Failed updating tickers:', e.message);
    process.exitCode = 1;
  }
}

main();
