const { emailSender } = require('./index');
const { sendSubscribeEmail, sendEmailNotifications } = require('../notifications/emailController');

module.exports = (req, res) => {
  emailSender.process('subscribeEmail', async (job) => {
    return sendSubscribeEmail(req, res);
  });

  emailSender.process('sendEmailNotification', async (job) => {
    return sendEmailNotifications(job.data);
  });

  // emailSender.on('completed', async (job, result) => {
  //   console.log('emailSender Completed result: ', result);
  // });
};
