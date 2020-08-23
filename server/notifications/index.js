const sendEmailNotifications = require('../tasks/emailSender');
const sendBrowser = require('../tasks/browserSender');

module.exports = async (req, res) => {
  sendEmailNotifications();
  sendBrowser(req, res);
};
