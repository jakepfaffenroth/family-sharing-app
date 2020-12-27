const { sendEmailNotifications } = require('../notifications/emailController');

module.exports = async (job) => {
  // Only try to process queue if a job still exists (if notifs haven't already been sent)
  try {
    // notificationEmailSender.process('*', async (job) => {
    return await sendEmailNotifications(job.data);
    // });
  } catch (err) {
    error('Email notifications error:', err);
  }
};
