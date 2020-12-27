const sendEmailNotifications = require('../tasks/notificationEmailSender');
const sendBrowser = require('../tasks/browserSender');

module.exports = async (req, res) => {
  sendEmailNotifications();
  sendBrowser(req, res);
};
