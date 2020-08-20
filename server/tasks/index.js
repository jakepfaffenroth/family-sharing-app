const Redis = require('ioredis');
const queue = require('bull');
const { setQueues } = require('bull-board');

const redisUrl = '127.0.0.1:6379';
const client = new Redis(redisUrl);
const subscriber = new Redis(redisUrl);

const config = {
  // redis: {
  //   port: 6379,
  //   host: '127.0.0.1',
  //   // password: process.env.REDIS_AUTH
  // },
  createClient: function (type) {
    switch (type) {
      case 'client':
        return client;
      case 'subscriber':
        return subscriber;
      case 'bclient':
        return new Redis(redisUrl);
      default:
        throw new Error('Unexpected connection type: ', type);
    }
  },
};

module.exports = {
  imgCompressor: new queue('imgCompressor', config),
  uploader: new queue('imgUploader', config),
  dbWriter: new queue('dbWriter', config),
  emailSender: new queue('sendEmailNotification', config),
};

setQueues([module.exports.imgCompressor, module.exports.uploader, module.exports.dbWriter, module.exports.emailSender]);
