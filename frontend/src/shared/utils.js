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

// Removed unused helpers (previously: getAdjustedValues, mapCryptoSymbols)
// These were unreferenced across the codebase and removed to reduce noise.

// === utils.js ===
