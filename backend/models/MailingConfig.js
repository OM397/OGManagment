const mongoose = require('mongoose');

const mailingConfigSchema = new mongoose.Schema({
  // schedule.weekdays: array de números (0=Domingo .. 6=Sábado)
  // Para retrocompatibilidad, si solo existe schedule.weekday se migrará a [weekday]
  schedule: {
    weekdays: { type: [Number], required: false },
    weekday: { type: Number, required: false }, // legado
    hour: { type: Number, required: true }    // 0-23
  },
  mailBody: {
    type: String,
    default: '<h2>Hola {username},</h2>\n<p>Este es tu resumen semanal de inversiones.</p>\n{tabla}'
  }
}, { timestamps: true });

module.exports = mongoose.model('MailingConfig', mailingConfigSchema);
