const { browserSender } = require('./index');
const { sendBrowserNotifications } = require('../notifications/browserController');

module.exports = (req, res) => {
  browserSender.process('sendBrowserNotification', async (job) => {
    return sendBrowserNotifications(job.data);
  });
};
