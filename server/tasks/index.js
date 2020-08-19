const queue = require('bull');
const { setQueues } = require('bull-board');
const monitoro = require('monitoro');

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
  // processedImgsQueue: new queue('processedImgsQueue', config),
};
setQueues('imgCompressor');

const queueConfigArray = [
  {
    name: 'imgCompressor',
    hostId: 'redis',
    url: 'redis://localhost:6379',
  },
];

// app.locals.MonitoroQueues = queueConfigArray;
