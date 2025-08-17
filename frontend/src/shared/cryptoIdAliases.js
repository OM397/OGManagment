// Minimal alias map for cryptos whose CoinGecko id differs from common symbol
// Extend as needed safely.
export const CRYPTO_ID_ALIASES = {
  // Canonicals for top symbols (avoid collisions in CoinGecko list)
  btc: 'bitcoin',
  eth: 'ethereum',
  xrp: 'ripple',
  sol: 'solana',
  ada: 'cardano',
  doge: 'dogecoin',
  // Specials
  trump: 'official-trump'
};
