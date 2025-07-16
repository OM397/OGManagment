const mongoose = require('mongoose');

const mailingConfigSchema = new mongoose.Schema({
  schedule: {
    weekday: { type: Number, required: true }, // 0=Sunday, 1=Monday, ...
    hour: { type: Number, required: true }    // 0-23
  },
  mailBody: {
    type: String,
    default: '<h2>Hola {username},</h2>\n<p>Este es tu resumen semanal de inversiones.</p>\n{tabla}'
  }
}, { timestamps: true });

module.exports = mongoose.model('MailingConfig', mailingConfigSchema);
