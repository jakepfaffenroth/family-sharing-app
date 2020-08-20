const queue = require('bull');
const { setQueues } = require('bull-board');

const config = {
  redis: {
    port: 6379,
    host: '127.0.0.1',
    // password: process.env.REDIS_AUTH
  },
};

module.exports = {
  imgCompressor: new queue('imgCompressor', config),
  uploader: new queue('imgUploader', config),
  dbWriter: new queue('dbWriter', config),
};

setQueues([module.exports.imgCompressor, module.exports.uploader, module.exports.dbWriter]);