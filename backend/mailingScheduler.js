// 📁 backend/mailingScheduler.js
const cron = require('node-cron');
const MailingConfig = require('./models/MailingConfig');
const { sendWeeklySummary } = require('./weeklyEmailJob');

let currentTasks = [];

function sanitizeDays(raw) {
  const arr = Array.isArray(raw) ? raw : [];
  const cleaned = arr
    .filter(d => Number.isInteger(d) && d >= 0 && d <= 6)
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort();
  return cleaned.length ? cleaned : [0]; // fallback Domingo
}

function getCronExpression(weekday, hour) {
  return `0 ${hour} * * ${weekday}`; // m h dom mes dow
}

async function scheduleMailingJob() {
  if (process.env.RUN_SCHEDULER && ['false','0','no'].includes(process.env.RUN_SCHEDULER.toLowerCase())) {
    console.log('⏭️  RUN_SCHEDULER set to false. Skipping scheduling.');
    return;
  }
  // Parar tareas previas
  currentTasks.forEach(t => t.stop());
  currentTasks = [];
  const config = await MailingConfig.findOne();
  if (!config || !config.schedule) {
    console.warn('No hay configuración de mailing. No se programan jobs.');
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
    const cronExp = getCronExpression(day, hour);
    console.log(`⏰ Programando mailing semanal: ${cronExp} (0=Domingo)`);
    try {
      const task = cron.schedule(cronExp, async () => {
        console.log('⏰ Ejecutando mailing semanal automático (día', day, ')...');
        await sendWeeklySummary();
      }, { timezone: 'Europe/Madrid' });
      currentTasks.push(task);
    } catch (err) {
      console.error('Error programando cron', cronExp, err.message);
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
