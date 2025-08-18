// 📁 services/rateLimitedProviders.js
// Intelligent API rate limiting and request batching

const EventEmitter = require('events');

class ProviderManager extends EventEmitter {
  constructor() {
    super();
    this.providers = {
      coingecko: {
        lastRequest: 0,
  cooldownMs: 2000, // 2 segundos entre llamadas para suavizar ráfagas
        batchBuffer: [],
        batchTimeout: null,
  batchDelay: 5000, // Acumular requests por 5 segundos para agrupar más y llamar menos
        rateLimitedUntil: 0,
        requestCount: 0,
  dailyLimit: 2000,
  // Nuevo: límite por minuto y contadores de ventana
  perMinuteLimit: 40,
  minuteStart: Date.now(),
  minuteCount: 0
      },
      yahoo: {
        lastRequest: 0,
        cooldownMs: 100, // 100ms entre llamadas
        requestCount: 0,
        dailyLimit: 1000
      },
      twelvedata: {
        lastRequest: 0,
        cooldownMs: 500, // 500ms entre llamadas
        requestCount: 0,
        dailyLimit: 800
      },
      finnhub: {
        lastRequest: 0,
        cooldownMs: 200, // 200ms entre llamadas
        requestCount: 0,
        dailyLimit: 300
      }
    };
    
    // Reset counters daily
    setInterval(() => {
      Object.values(this.providers).forEach(p => p.requestCount = 0);
    }, 24 * 60 * 60 * 1000);
  }

  // Check if provider is available (not rate limited or over daily limit)
  isProviderAvailable(providerName) {
    const provider = this.providers[providerName];
    if (!provider) return false;
    
    const now = Date.now();
    const isCoolingDown = now - provider.lastRequest < provider.cooldownMs;
    const isRateLimited = now < provider.rateLimitedUntil;
    const isOverLimit = provider.requestCount >= provider.dailyLimit;
    
    return !isCoolingDown && !isRateLimited && !isOverLimit;
  }

  // Mark provider as rate limited
  setRateLimit(providerName, cooldownMs = 60000) {
    const provider = this.providers[providerName];
    if (provider) {
      provider.rateLimitedUntil = Date.now() + cooldownMs;
      console.warn(`🚫 Provider ${providerName} rate limited for ${cooldownMs}ms`);
    }
  }

  // Execute request with rate limiting
  async executeWithRateLimit(providerName, requestFn) {
    const provider = this.providers[providerName];
    if (!provider) throw new Error(`Unknown provider: ${providerName}`);

    if (!this.isProviderAvailable(providerName)) {
      throw new Error(`Provider ${providerName} not available (rate limited or over daily limit)`);
    }

    let now = Date.now();
    // Ventana por minuto: si se excede, esperar hasta el inicio de la próxima ventana
    if (typeof provider.perMinuteLimit === 'number') {
      if (now - provider.minuteStart >= 60000) {
        provider.minuteStart = now;
        provider.minuteCount = 0;
      } else if (provider.minuteCount >= provider.perMinuteLimit) {
        const waitMs = 60000 - (now - provider.minuteStart);
        const delay = (ms) => new Promise(r => setTimeout(r, ms));
        console.warn(`⏳ ${providerName} per-minute limit reached (${provider.perMinuteLimit}/min). Waiting ${waitMs}ms…`);
        await delay(waitMs);
        provider.minuteStart = Date.now();
        provider.minuteCount = 0;
        now = provider.minuteStart;
      }
    }

    const waitTime = Math.max(0, provider.cooldownMs - (now - provider.lastRequest));
    
    if (waitTime > 0) {
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    provider.lastRequest = Date.now();
    provider.requestCount++;
    if (typeof provider.perMinuteLimit === 'number') {
      provider.minuteCount++;
    }

    try {
      const result = await requestFn();
      return result;
    } catch (error) {
      // Handle rate limiting responses
      if (error.response?.status === 429) {
        this.setRateLimit(providerName, 60000); // 1 minute cooldown
      }
      throw error;
    }
  }

  // Batch CoinGecko requests
  batchCoinGeckoRequest(cryptoIds) {
    return new Promise((resolve, reject) => {
      const provider = this.providers.coingecko;
      
      // Add to batch buffer
      provider.batchBuffer.push({ cryptoIds, resolve, reject });

      // Clear existing timeout
      if (provider.batchTimeout) {
        clearTimeout(provider.batchTimeout);
      }

      // Set new timeout to process batch
      provider.batchTimeout = setTimeout(() => {
        this.processCoinGeckoBatch();
      }, provider.batchDelay);
    });
  }

  async processCoinGeckoBatch() {
    const provider = this.providers.coingecko;
    const batch = [...provider.batchBuffer];
    provider.batchBuffer = [];
    provider.batchTimeout = null;

    if (batch.length === 0) return;

    // Collect all unique crypto IDs
    const allIds = [...new Set(batch.flatMap(b => b.cryptoIds))];
    
    console.log(`🔄 Processing CoinGecko batch: ${allIds.length} unique cryptos from ${batch.length} requests`);

    try {
      if (!this.isProviderAvailable('coingecko')) {
        throw new Error('CoinGecko not available');
      }

      const result = await this.executeWithRateLimit('coingecko', async () => {
        const axios = require('axios');
        const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
          params: {
            ids: allIds.join(','),
            vs_currencies: 'eur',
            include_market_cap: true
          },
          timeout: 10000
        });
        return response.data;
      });

      // Resolve all requests with their relevant data
      batch.forEach(({ cryptoIds, resolve }) => {
        const filteredData = {};
        cryptoIds.forEach(id => {
          if (result[id]) {
            filteredData[id] = result[id];
          }
        });
        resolve(filteredData);
      });

    } catch (error) {
      console.error('❌ CoinGecko batch failed:', error.message);
      // Reject all pending requests
      batch.forEach(({ reject }) => reject(error));
    }
  }

  // Get provider statistics
  getStats() {
    const stats = {};
    Object.entries(this.providers).forEach(([name, provider]) => {
      stats[name] = {
        requestCount: provider.requestCount,
        dailyLimit: provider.dailyLimit,
        isRateLimited: Date.now() < provider.rateLimitedUntil,
        utilizationPercent: Math.round((provider.requestCount / provider.dailyLimit) * 100)
      };
    });
    return stats;
  }
}

// Singleton instance
const providerManager = new ProviderManager();

module.exports = providerManager;
