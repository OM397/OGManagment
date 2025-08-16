const axios = require('axios');

async function fetchWithRetry(url, options = {}, retries = 3, delay = 500) {
  let attempt = 0;
  while (attempt < retries) {
    try {
      const response = await axios({ url, ...options });
      return response.data;
    } catch (err) {
      attempt++;
  // ...existing code...
      if (attempt >= retries) throw err;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

module.exports = { fetchWithRetry };
