// 📁 backend/weeklyEmailJob.js
// Cron job para enviar resumen semanal solo a usuarios con receiveWeeklyEmail: true

const mongoose = require('mongoose');
const User = require('./models/User');
const { sendEmail } = require('./utils/emailService');
require('dotenv').config();

const marketData = require('./services/unifiedMarketDataService');
const redis = require('./redisClient');

function calculateIRRWithTimes(flows, guess = 0.1, maxIterations = 100, tolerance = 1e-6) {
  let rate = guess;
  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let d_npv = 0;
    for (let j = 0; j < flows.length; j++) {
      const t = flows[j].time;
      npv += flows[j].amount / Math.pow(1 + rate, t);
      d_npv -= t * flows[j].amount / Math.pow(1 + rate, t + 1);
    }
    const newRate = rate - npv / d_npv;
    if (Math.abs(newRate - rate) < tolerance) return newRate;
    rate = newRate;
  }
  return null;
}

async function sendWeeklySummary() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
  // Cargar la configuración de mailing
  const config = await require('./models/MailingConfig').findOne();
  // Construir Market Summary una sola vez para todos los usuarios (evita repetir llamadas)
  let marketSummary = null;
  try {
    const { buildSummary } = require('./controllers/marketSummaryController');
  // Forzar reconstrucción para asegurar datos frescos en el email
  marketSummary = await buildSummary({ force: true });
    // Si por algún motivo viene vacío, intentar cargar el último snapshot bueno
    if (!marketSummary?.assets?.length) {
      const last = await redis.get('marketSummary:lastGood');
      if (last) marketSummary = JSON.parse(last);
    }
  } catch (e) {
    // Error al construir Market Summary para el email -> intentar cargar el último snapshot bueno
    try {
      const last = await redis.get('marketSummary:lastGood');
      if (last) marketSummary = JSON.parse(last);
    } catch (_) {}
  }

  const formatPct = v => v == null ? '-' : (v * 100).toFixed(2) + '%';
  const formatPrice = v => v == null ? '-' : v.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatCap = v => {
    if (v == null || isNaN(v)) return '-';
    if (v >= 1e12) return '€' + (v/1e12).toFixed(2) + 'T';
    if (v >= 1e9) return '€' + (v/1e9).toFixed(2) + 'B';
    if (v >= 1e6) return '€' + (v/1e6).toFixed(2) + 'M';
    if (v >= 1e3) return '€' + (v/1e3).toFixed(1) + 'K';
    return '€' + v.toFixed(2);
  };
  const marketSummaryTable = marketSummary ? (() => {
    const rows = (marketSummary.assets || []).map(a => `<tr>
      <td>${a.label || a.id}</td>
      <td style="text-align:right;">${formatPrice(a.price)}</td>
      <td style="text-align:right;">${formatCap(a.marketCap)}</td>
      <td style="text-align:right;">${formatPct(a.changes?.['7d'])}</td>
      <td style="text-align:right;">${formatPct(a.changes?.['30d'])}</td>
      <td style="text-align:right;">${formatPct(a.changes?.['1y'])}</td>
    </tr>`).join('');
    return `<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;min-width:500px;margin-top:12px;">
      <thead style="background:#f3f3f3;">
        <tr>
          <th>Asset</th><th>Price</th><th>Market Cap</th><th>7d</th><th>30d</th><th>1y</th>
        </tr>
      </thead>
      <tbody>${rows || '<tr><td colspan="6">Sin datos.</td></tr>'}</tbody>
    </table>`;
  })() : '<p style="color:#888;">(Sin Market Summary disponible)</p>';
  const users = await User.find({ receiveWeeklyEmail: true });
  for (const user of users) {
    try {
      const investmentsByGroup = user.data?.Investments || {};
      let rows = '';
      for (const [groupName, investments] of Object.entries(investmentsByGroup)) {
        if (!Array.isArray(investments)) continue;
        for (const inv of investments) {
          if (!inv.id || !inv.type || !inv.initialQty || !inv.initialCost) continue;
          // Obtener precio actual y moneda
          let actualValue = null;
          let lastPrice = null;
          let priceCurrency = 'EUR';
          try {
            const priceData = await marketData.fetchPrice(inv.id, inv.type);
            lastPrice = priceData?.price || null;
            priceCurrency = priceData?.currency || 'EUR';
            actualValue = lastPrice !== null ? (inv.initialQty * lastPrice) : null;
          } catch (e) {}
          // Moneda inicial (asumimos EUR si no hay campo, puedes ajustar si guardas la moneda de compra)
          let initialCurrency = 'EUR';
          if (inv.initialCurrency) initialCurrency = inv.initialCurrency;
          // Si la moneda es distinta, convertir actualValue a la moneda inicial
          if (actualValue !== null && priceCurrency !== initialCurrency) {
            try {
              const fx = await marketData.getFXRates([priceCurrency]);
              const rate = fx[priceCurrency] || 1;
              actualValue = actualValue / rate;
            } catch (e) {}
          }
          // Initial Value
          const initialValue = inv.initialCost * inv.initialQty;
          // Variación
          let variation = null;
          if (actualValue !== null && initialValue) {
            variation = ((actualValue - initialValue) / initialValue) * 100;
          }
          // TIR (IRR) - fórmula directa anualizada para dos flujos
          let tir = null;
          if (lastPrice !== null && inv.initialDate) {
            const start = new Date(inv.initialDate);
            const end = new Date();
            const years = (end - start) / (1000 * 60 * 60 * 24 * 365.25);
            if (years > 0 && initialValue > 0 && actualValue !== null && Math.abs(actualValue - initialValue) > 1e-2) {
              // Fórmula directa anualizada
              tir = Math.pow(actualValue / initialValue, 1 / years) - 1;
              // TIR DIRECTA calculada
            } else {
              // No se calcula TIR para este caso
            }
          }
          rows += `<tr>
            <td>${groupName}</td>
            <td>${inv.name || inv.id}</td>
            <td>${initialValue ? initialValue.toLocaleString('es-ES', { style: 'currency', currency: initialCurrency }) : '-'}</td>
            <td>${actualValue !== null ? actualValue.toLocaleString('es-ES', { style: 'currency', currency: initialCurrency }) : '-'}</td>
            <td>${variation !== null ? variation.toFixed(2) + '%' : '-'}</td>
            <td>${tir !== null ? (tir * 100).toFixed(2) + '%' : '-'}</td>
          </tr>`;
        }
      }
      // Cuerpo editable del admin
      let mailBody = config && config.mailBody ? config.mailBody : 'Hola {username},\n\nEste es tu resumen semanal de inversiones.\n\n{tabla}';
      // Reemplazar {username} por el nombre del usuario
      mailBody = mailBody.replace(/\{username\}/g, user.username.split('@')[0]);
      // Generar tabla HTML
      const tablaHTML = `
        <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;min-width:500px;">
          <thead style="background:#f3f3f3;">
            <tr>
              <th>Grupo</th>
              <th>Inversión</th>
              <th>Initial Value</th>
              <th>Actual Value</th>
              <th>Variación de la inversión</th>
              <th>TIR</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="6">Sin inversiones registradas.</td></tr>'}</tbody>
        </table>
      `;
      // Reemplazar {tabla}
      mailBody = mailBody.replace(/\{tabla\}/g, tablaHTML);
      // Si el admin puso {marketsummary}, reemplazar ahí; si no, lo añadimos después de la tabla
      if (/\{marketsummary\}/i.test(mailBody)) {
        mailBody = mailBody.replace(/\{marketsummary\}/gi, '<strong>Market Summary</strong><br>' + marketSummaryTable);
      } else {
        mailBody += '<br><br><strong>Market Summary</strong><br>' + marketSummaryTable;
      }
      // Pie de página
      mailBody += '<p style="font-size:12px;color:#888;">Este es un email automático de CAP Tracker.</p>';
      await sendEmail({
        to: user.username,
        subject: 'Resumen semanal de tu portafolio',
        html: mailBody
      });
  // Resumen enviado
    } catch (err) {
      // Error enviando resumen
    }
  }
  if (mongoose.connection.readyState === 1 && !module.parent) {
    await mongoose.disconnect();
  }
}

// Ejecutar manualmente para pruebas
if (require.main === module) {
  sendWeeklySummary().then(() => process.exit());
}

module.exports = { sendWeeklySummary };
