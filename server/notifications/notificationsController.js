const bodyParser = require('body-parser');

module.exports.removeBouncedEmail = async (req, res) => {
  console.log('req: ', req.body.SubscribeURL);
  console.log('req: ', req);
};
