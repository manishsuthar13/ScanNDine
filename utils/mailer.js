const nodemailer = require('nodemailer');
const logger = require('./logger');

let transporter;
const getTransporter = () => {
  if (!process.env.SMTP_HOST) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
  }
  return transporter;
};

// Without SMTP configured (local dev) the message is logged instead of sent
const sendMail = async ({ to, subject, text, html }) => {
  const smtp = getTransporter();
  if (!smtp) {
    logger.warn(`SMTP not configured - email to ${to} not sent`, { subject, text });
    return;
  }
  await smtp.sendMail({ from: process.env.MAIL_FROM || 'Scan & Dine <no-reply@scanndine.local>', to, subject, text, html });
  logger.info(`Email sent to ${to}`, { subject });
};

const sendPasswordReset = (user, link) => sendMail({
  to: user.email,
  subject: 'Reset your Scan & Dine password',
  text: `Hi ${user.username},\n\nUse this link to set a new password (valid for 30 minutes):\n${link}\n\nIf you didn't ask for this, you can ignore this email.`,
  html: `<p>Hi ${user.username},</p><p><a href="${link}">Set a new password</a> (link valid for 30 minutes).</p><p>If you didn't ask for this, you can ignore this email.</p>`,
});

module.exports = { sendMail, sendPasswordReset };
