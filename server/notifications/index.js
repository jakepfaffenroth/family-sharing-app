const sendEmails = require('../tasks/emailSender');
const sendBrowser = require('../tasks/browserSender');

module.exports = async (req, res) => {
  sendEmails(req, res);
  sendBrowser(req, res);
};
