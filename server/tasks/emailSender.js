const { emailSender } = require('./index');
const { sendEmailNotifications } = require('../notifications/emailController');

module.exports = async () => {
  // Only try to process queue if a job still exists (if notifs haven't already been sent)
  if (await emailSender.count()) {
    emailSender.process('*', async (job) => {
      return sendEmailNotifications(job.data);
    });
  }
};
