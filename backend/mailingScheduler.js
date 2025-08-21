// 📁 backend/mailingScheduler.js
const cron = require('node-cron');
const MailingConfig = require('./models/MailingConfig');
const { sendWeeklySummary, prewarmUserAssets } = require('./weeklyEmailJob');
const { prewarmSummary } = require('./controllers/marketSummaryController');

let currentTasks = [];

function sanitizeDays(raw) {
  const arr = Array.isArray(raw) ? raw : [];
  const cleaned = arr
    .filter(d => Number.isInteger(d) && d >= 0 && d <= 6)
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort();
  return cleaned.length ? cleaned : [0]; // fallback Domingo
}

function getCronExpression(weekday, hour, minute = 0) {
  // minute hour * * weekday
  return `${minute} ${hour} * * ${weekday}`;
}

async function scheduleMailingJob() {
  if (process.env.RUN_SCHEDULER && ['false','0','no'].includes(process.env.RUN_SCHEDULER.toLowerCase())) {
 //   console.log('⏭️  RUN_SCHEDULER set to false. Skipping scheduling.');
    return;
  }
  // Parar tareas previas
  currentTasks.forEach(t => t.stop());
  currentTasks = [];
  const config = await MailingConfig.findOne();
  if (!config || !config.schedule) {
 //   console.warn('No hay configuración de mailing. No se programan jobs.');
    return;
  }
  // Migración en caliente
  if (config.schedule && !config.schedule.weekdays && typeof config.schedule.weekday === 'number') {
    config.schedule.weekdays = [config.schedule.weekday];
    delete config.schedule.weekday;
    await config.save();
  }
  let { weekdays, hour } = config.schedule || {};
  // Reparar hour inválido
  if (typeof hour !== 'number' || hour < 0 || hour > 23) {
    hour = 10;
    config.schedule.hour = hour;
  }
  const cleaned = sanitizeDays(weekdays);
  if (!weekdays || cleaned.join(',') !== (Array.isArray(weekdays) ? weekdays.join(',') : '')) {
    config.schedule.weekdays = cleaned;
    try { await config.save(); } catch (e) { console.warn('No se pudo guardar schedule saneado:', e.message); }
  }
  cleaned.forEach(day => {
    // Tres tareas: T-5min, T-2min (prewarm), y T (send)
    // Prewarm debe ir en la hora anterior; si hour=0 → día anterior (dow-1)
    const preHour = (hour + 23) % 24;
    const preDay = hour === 0 ? ((day + 6) % 7) : day;
    const cronPre5 = getCronExpression(preDay, preHour, 55); // (hour-1):55 → 5 minutos antes
    const cronPre2 = getCronExpression(preDay, preHour, 58); // (hour-1):58 → 2 minutos antes
    const cronSend = getCronExpression(day, hour, 0);        // hh:00 → envío

 // console.log(`⏰ Programando prewarm T-5: ${cronPre5} (0=Domingo)`);
    try {
      const t1 = cron.schedule(cronPre5, async () => {
        console.log('🔥 Prewarm (T-5): Market Summary + User Assets...');
        try { await prewarmSummary(); } catch (e) { console.warn('Prewarm Summary T-5 falló:', e.message); }
        try { const r = await prewarmUserAssets(); console.log('Prewarm UserAssets T-5:', r); } catch (e) { console.warn('Prewarm UserAssets T-5 falló:', e.message); }
      }, { timezone: 'Europe/Madrid' });
      currentTasks.push(t1);
    } catch (err) {
      console.error('Error programando cron', cronPre5, err.message);
    }

//  console.log(`⏰ Programando prewarm T-2: ${cronPre2} (0=Domingo)`);
    try {
      const t2 = cron.schedule(cronPre2, async () => {
        console.log('🔥 Prewarm (T-2): Market Summary + User Assets...');
        try { await prewarmSummary(); } catch (e) { console.warn('Prewarm Summary T-2 falló:', e.message); }
        try { const r = await prewarmUserAssets(); console.log('Prewarm UserAssets T-2:', r); } catch (e) { console.warn('Prewarm UserAssets T-2 falló:', e.message); }
      }, { timezone: 'Europe/Madrid' });
      currentTasks.push(t2);
    } catch (err) {
      console.error('Error programando cron', cronPre2, err.message);
    }

   // console.log(`⏰ Programando mailing semanal (envío): ${cronSend} (0=Domingo)`);
    try {
      const t3 = cron.schedule(cronSend, async () => {
   //     console.log('📧 Ejecutando mailing semanal automático...');
        // Última milla
        try { await prewarmSummary(); } catch (_) {}
        try { await prewarmUserAssets(); } catch (_) {}
        await sendWeeklySummary();
      }, { timezone: 'Europe/Madrid' });
      currentTasks.push(t3);
    } catch (err) {
      console.error('Error programando cron', cronSend, err.message);
    }
  });
}

// Reprogramar cuando cambie la config
async function watchMailingConfig() {
  if (process.env.RUN_SCHEDULER && ['false','0','no'].includes(process.env.RUN_SCHEDULER.toLowerCase())) {
    return; // no watcher if disabled
  }
  let lastConfig = null;
  setInterval(async () => {
    const config = await MailingConfig.findOne();
    const hasSchedule = config && config.schedule;
    if (!hasSchedule) return;
    // Normalizar snapshot
    const current = {
      hour: (typeof config.schedule.hour === 'number' ? config.schedule.hour : 10),
      weekdays: sanitizeDays(config.schedule.weekdays || [config.schedule.weekday])
    };
    const changed = !lastConfig || current.hour !== lastConfig.hour || current.weekdays.join(',') !== lastConfig.weekdays.join(',');
    if (changed) {
      await scheduleMailingJob();
      lastConfig = current;
    }
  }, 60 * 1000); // Revisar cada minuto
}

module.exports = { scheduleMailingJob, watchMailingConfig };
