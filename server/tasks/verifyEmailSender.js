const { sendVerifyEmail } = require('../users/guestController');

module.exports = async (job) => {
  return await sendVerifyEmail(job.data);
};
