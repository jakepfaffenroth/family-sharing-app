module.exports.removeBouncedEmail = async (req, res) => {
  req = JSON.parse(req)
  console.log('req: ', req.body.SubscribeURL);
  console.log('req: ', req);
};
