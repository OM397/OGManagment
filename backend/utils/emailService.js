// 📁 backend/utils/emailService.js


require('dotenv').config();
const { Resend } = require('resend');
const RESEND_KEY = process.env.RESEND_API_KEY;
let resend = null;
if (RESEND_KEY) {
  resend = new Resend(RESEND_KEY);
} else {
  // ...existing code...
}

async function sendEmail({ to, subject, html, text }) {
  // Si no hay clave, simulamos envío en entorno dev/test para no romper registro
  if (!resend) {
  // ...existing code...
    return { simulated: true };
  }
  try {
    const payload = {
      from: 'CAP Tracker <no-reply@capitaltracker.app>',
      to,
      subject,
      html,
    };
    if (text) payload.text = text;
    const response = await resend.emails.send(payload);
  // ...existing code...
    return response;
  } catch (error) {
  // ...existing code...
    // En desarrollo devolvemos simulación para no bloquear
    if (process.env.NODE_ENV !== 'production') {
  // ...existing code...
      return { simulated: true, error: error.message };
    }
    throw error;
  }
}

module.exports = { sendEmail };
