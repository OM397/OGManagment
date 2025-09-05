// === utils.js ===
export const formatter = {
  format(value) {
    // Redondear a entero y separar miles con puntos
    const roundedValue = Math.round(Number(value));
    const formatted = roundedValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `€ ${formatted}`;
  }
};

// Removed unused helpers (previously: getAdjustedValues, mapCryptoSymbols)
// These were unreferenced across the codebase and removed to reduce noise.

/**
 * Calcula el valor neto actual de una propiedad inmobiliaria
 * @param {Object} asset - Objeto del activo inmobiliario
 * @param {number} currentMarketValue - Valor actual de mercado
 * @returns {Object} - Objeto con valor bruto, neto y hipoteca restante
 */
export function calculateRealEstateNetValue(asset, currentMarketValue) {
  if (!asset.mortgageAmount || !asset.monthlyMortgagePayment || !asset.monthlyUpdateDay) {
    return {
      grossValue: currentMarketValue,
      netValue: currentMarketValue,
      remainingMortgage: 0,
      lastUpdate: null
    };
  }

  const now = new Date();
  const initialDate = asset.initialDate ? new Date(asset.initialDate) : now;
  const monthlyUpdateDay = asset.monthlyUpdateDay || 5;

  // Calcular meses transcurridos desde la fecha inicial
  const monthsElapsed = Math.max(0, 
    (now.getFullYear() - initialDate.getFullYear()) * 12 + 
    (now.getMonth() - initialDate.getMonth())
  );

  // Calcular hipoteca restante
  const totalPaid = asset.monthlyMortgagePayment * monthsElapsed;
  const remainingMortgage = Math.max(0, asset.mortgageAmount - totalPaid);

  // Calcular valor neto
  const netValue = currentMarketValue - remainingMortgage;

  return {
    grossValue: currentMarketValue,
    netValue: Math.max(0, netValue),
    remainingMortgage: remainingMortgage,
    monthsElapsed: monthsElapsed,
    totalPaid: totalPaid,
    lastUpdate: now.toISOString()
  };
}

/**
 * Actualiza el historial de hipoteca de una propiedad
 * @param {Object} asset - Objeto del activo inmobiliario
 * @param {number} currentMarketValue - Valor actual de mercado
 * @returns {Object} - Asset actualizado con nuevo historial
 */
export function updateMortgageHistory(asset, currentMarketValue) {
  if (!asset.mortgageAmount || !asset.monthlyMortgagePayment || !asset.monthlyUpdateDay) {
    return asset;
  }

  const now = new Date();
  const monthlyUpdateDay = asset.monthlyUpdateDay || 5;

  // Solo actualizar si es el día de actualización mensual
  if (now.getDate() !== monthlyUpdateDay) {
    return asset;
  }

  const netValueData = calculateRealEstateNetValue(asset, currentMarketValue);
  
  // Crear nueva entrada en el historial
  const newHistoryEntry = {
    date: now.toISOString(),
    remainingMortgage: netValueData.remainingMortgage,
    netValue: netValueData.netValue,
    grossValue: netValueData.grossValue
  };

  // Añadir al historial existente o crear uno nuevo
  const mortgageHistory = asset.mortgageHistory || [];
  mortgageHistory.push(newHistoryEntry);

  return {
    ...asset,
    mortgageHistory: mortgageHistory,
    lastMortgageUpdate: now.toISOString()
  };
}

// === utils.js ===
