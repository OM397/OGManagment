// 📁 backend/mailingScheduler.js
const cron = require('node-cron');
const MailingConfig = require('./models/MailingConfig');
const { sendWeeklySummary } = require('./weeklyEmailJob');

let currentTask = null;

function getCronExpression(weekday, hour) {
  // node-cron: m h d m w (0=Sunday, 1=Monday, ...)
  return `0 ${hour} * * ${weekday}`;
}

async function scheduleMailingJob() {
  // Cancelar tarea anterior si existe
  if (currentTask) {
    currentTask.stop();
    currentTask = null;
  }
  // Leer config actual
  const config = await MailingConfig.findOne();
  if (!config || !config.schedule) {
    console.warn('No hay configuración de mailing. No se programa el job.');
    return;
  }
  const { weekday, hour } = config.schedule;
  const cronExp = getCronExpression(weekday, hour);
  console.log(`⏰ Programando mailing semanal: ${cronExp} (0=Domingo)`);
  currentTask = cron.schedule(cronExp, async () => {
    console.log('⏰ Ejecutando mailing semanal automático...');
    await sendWeeklySummary();
  }, { timezone: 'Europe/Madrid' });
}

// Reprogramar cuando cambie la config
async function watchMailingConfig() {
  let lastConfig = null;
  setInterval(async () => {
    const config = await MailingConfig.findOne();
    const hasSchedule = config && config.schedule;
    const lastHasSchedule = lastConfig && lastConfig.weekday !== undefined && lastConfig.hour !== undefined;
    if (!lastHasSchedule || !hasSchedule ||
      config.schedule.weekday !== lastConfig.weekday ||
      config.schedule.hour !== lastConfig.hour) {
      await scheduleMailingJob();
      lastConfig = hasSchedule ? { ...config.schedule } : null;
    }
  }, 60 * 1000); // Revisar cada minuto
}

module.exports = { scheduleMailingJob, watchMailingConfig };
