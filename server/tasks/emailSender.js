const { emailSender } = require('./index');
const { subscribeEmail, sendEmailNotification } = require('../notifications/emailController');

module.exports = (req, res) => {
  
  // emailSender.process('subscribeEmail', async (job) => {
  //   return subscribeEmail(req, res);
  // });
  
  emailSender.process('sendEmailNotification', async (job) => {
    return sendEmailNotification(job.data);
  });

  emailSender.on('completed', async (job, result) => {
    console.log('emailSender Completed result: ', result);
  });
};
