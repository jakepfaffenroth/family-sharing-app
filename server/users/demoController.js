const db = require('../db').pgPromise;

module.exports = (req, res, next) => {
  if (req.body.ownerId === 'b880449e-366e-435f-94fb-fb6884e28cf8') {
    console.log('DEMO');
    res.status(200).json({ demo: true }).end();
  } else next();
};
