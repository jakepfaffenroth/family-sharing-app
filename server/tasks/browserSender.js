const { browserSender } = require('./index');
const { sendBrowserNotifications } = require('../notifications/browserController');

module.exports = async (req, res) => {
  
// Only try to process queue if a job still exists (if notifs haven't already been sent)
  if (await browserSender.count()) {
    browserSender.process('*', async (job) => {
      return sendBrowserNotifications(job.data);
    });
  }
};
