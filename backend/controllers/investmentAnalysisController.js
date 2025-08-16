// 📁 backend/controllers/investmentAnalysisController.js
const User = require('../models/User');
const marketData = require('../services/unifiedMarketDataService');

// Utilidad para calcular TIR
function calculateIRR(cashFlows, guess = 0.1, maxIterations = 100, tolerance = 1e-6) {
  let rate = guess;
  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let d_npv = 0;
    for (let t = 0; t < cashFlows.length; t++) {
      npv += cashFlows[t] / Math.pow(1 + rate, t);
      d_npv -= t * cashFlows[t] / Math.pow(1 + rate, t + 1);
    }
    const newRate = rate - npv / d_npv;
    if (Math.abs(newRate - rate) < tolerance) return newRate;
    rate = newRate;
  }
  return null; // No converge
}

// GET /api/investments/irr
exports.getInvestmentsIRR = async (req, res) => {
  try {
  const user = await User.findOne({ publicId: req.user.uid });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
    const investmentsByGroup = user.data?.Investments || {};
    const results = {};

    // Iterate over all groups in Investments
    for (const [groupName, investments] of Object.entries(investmentsByGroup)) {
      if (!Array.isArray(investments)) continue;
      for (const inv of investments) {
        // Espera: { id, name, initialQty, initialCost, type, initialDate }
        if (!inv.id || !inv.type || !inv.initialQty || !inv.initialCost) {
          console.log(`Skipping investment for missing fields:`, inv);
          continue;
        }
        // Obtener histórico de precios y moneda real
        const historyData = await marketData.fetchHistory(inv.id, inv.type, 365);
        // Si no se especifica initialCurrency, usar la moneda detectada en el histórico
        if (!inv.initialCurrency && historyData && historyData.currency) {
          inv.initialCurrency = historyData.currency;
        }
       // console.log(`\n---\nGROUP: ${groupName} | INVESTMENT: ${inv.name} (${inv.id})`);
       // console.log('History:', historyData);
        if (!historyData || !historyData.history || !historyData.history.length) {
          console.log('No history data, skipping.');
          results[inv.id] = { irr: null, id: inv.id, name: inv.name, group: groupName, reason: 'No history data' };
          continue;
        }
        // Calcular initialValueEUR y actualValueEUR si faltan
        let initialValueEUR = inv.initialValueEUR;
        let actualValueEUR = inv.actualValueEUR;
        console.log('inv.actualValue:', inv.actualValue);
        if (!isFinite(actualValueEUR) && inv.actualValue !== undefined && inv.actualValue !== null) {
          const parsedActual = Number(inv.actualValue);
          if (isFinite(parsedActual)) {
            actualValueEUR = parsedActual;
          }
        }
        console.log(`\n---\nINVESTMENT: ${inv.name} (${inv.id})`);
        console.log('initialValueEUR (antes):', initialValueEUR, 'actualValueEUR (antes):', actualValueEUR);
        // Si faltan, calcular usando initialCost, initialQty, actualCost, actualQty y conversión a EUR
        if (!isFinite(initialValueEUR)) {
          console.log('Calculando initialValueEUR...');
          // initialCost y initialQty pueden estar en cualquier moneda
          let cost = inv.initialCost;
          let qty = inv.initialQty;
          let currency = inv.initialCurrency || inv.currency || 'EUR';
          if (isFinite(cost) && isFinite(qty)) {
            let value = cost * qty;
            let rate = 1;
            if (currency !== 'EUR' && marketData && marketData.getFXRates) {
              // Intentar obtener tipo de cambio
              try {
                const fx = await marketData.getFXRates([currency]);
                rate = fx && fx[currency] ? fx[currency] : 1;
                rate = Number(rate).toFixed(8) * 1;
                initialValueEUR = value / rate;
              } catch (e) {
                initialValueEUR = value;
              }
            } else {
              initialValueEUR = value;
            }
          }
        }
        if (!isFinite(actualValueEUR)) {
          console.log('Calculando actualValueEUR...');
          let cost = inv.actualCost;
          let qty = inv.actualQty;
          let currency = inv.actualCurrency || inv.currency || 'EUR';
          if (isFinite(cost) && isFinite(qty)) {
            let value = cost * qty;
            let rate = 1;
            if (currency !== 'EUR' && marketData && marketData.getFXRates) {
              try {
                const fx = await marketData.getFXRates([currency]);
                rate = fx && fx[currency] ? fx[currency] : 1;
                rate = Number(rate).toFixed(8) * 1;
                actualValueEUR = value / rate;
              } catch (e) {
                actualValueEUR = value;
              }
            } else {
              actualValueEUR = value;
            }
          }
        }
        console.log('initialValueEUR (final):', initialValueEUR, 'actualValueEUR (final):', actualValueEUR);
        if (!isFinite(initialValueEUR) || !isFinite(actualValueEUR)) {
          console.log('❌ Missing EUR values. initialValueEUR:', initialValueEUR, 'actualValueEUR:', actualValueEUR);
          results[inv.id] = { irr: null, id: inv.id, name: inv.name, group: groupName, reason: 'Missing EUR values' };
          continue;
        }
        let years = 1;
        if (inv.initialDate) {
          const start = new Date(inv.initialDate);
          const end = new Date();
          const diffMs = end - start;
          years = diffMs / (1000 * 60 * 60 * 24 * 365.25);
        }
        if (!isFinite(initialValueEUR) || !isFinite(actualValueEUR) || years <= 0) {
          console.log('❌ Invalid values or years. initialValueEUR:', initialValueEUR, 'actualValueEUR:', actualValueEUR, 'years:', years);
          results[inv.id] = { irr: null, id: inv.id, name: inv.name, group: groupName, reason: 'Invalid values or years' };
          continue;
        }
        // TIR anualizada estándar (decimal)
        let irr = null;
        if (initialValueEUR > 0 && actualValueEUR > 0 && years > 0) {
          irr = Math.pow(actualValueEUR / initialValueEUR, 1 / years) - 1;
        }
        if (irr === null) {
          console.log('IRR did not converge or is not computable.');
          results[inv.id] = { irr: null, id: inv.id, name: inv.name, group: groupName, reason: 'IRR did not converge' };
        } else {
          console.log('IRR result:', irr);
          results[inv.id] = { irr, id: inv.id, name: inv.name, group: groupName };
        }
      }
    }
    res.json({ irr: results });
  } catch (err) {
    console.error('❌ Error calculando IRR:', err);
    res.status(500).json({ error: 'Error calculando IRR' });
  }
};
