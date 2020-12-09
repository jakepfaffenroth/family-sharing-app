const { sendOwnerConfirmationEmail } = require('../users/emailController');
const { sendEmailNotifications } = require('../notifications/emailController');
const { sendGuestVerificationEmail } = require('../users/emailController');

const ownerConfirmation = async (job) => {
  console.log('typeof sendConfirmEmail:', typeof sendOwnerConfirmationEmail);
  return await sendOwnerConfirmationEmail(job.data);
};

const guestVerification = async (job) => {
  return await sendGuestVerificationEmail(job.data);
};

const emailNotification = async (job) => {
  // Only try to process queue if a job still exists (if notifs haven't already been sent)
  try {
    return await sendEmailNotifications(job.data);
  } catch (err) {
    error('Email notifications error:', err);
  }
};

module.exports = { ownerConfirmation, guestVerification, emailNotification };
