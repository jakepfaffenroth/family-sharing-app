const { sendGuestVerificationEmail } = require('../users/guestController');

module.exports = async (job) => {
  return await sendGuestVerificationEmail(job.data);
};
