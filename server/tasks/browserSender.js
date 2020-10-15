const { browserSender } = require('./index');
const {
  sendBrowserNotifications,
} = require('../notifications/browserController');

module.exports = async (job) => {
  try {
    // Only try to process queue if a job still exists (if notifs haven't already been sent)
    // browserSender.process(, async (job) => {
    return sendBrowserNotifications(job.data);
    // });
  } catch (err) {
    console.log('Browser notifications error:', err);
  }
};
