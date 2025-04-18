// 📁 backend/utils/emailService.js

const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail({ to, subject, html }) {
  try {
    const response = await resend.emails.send({
      from: 'CAP Tracker <no-reply@capitaltracker.app>',
      to,
      subject,
      html,
    });
    console.log('✅ Email enviado:', response);
  } catch (error) {
    console.error('❌ Error al enviar el email:', error);
    throw error;
  }
}

module.exports = { sendEmail };
