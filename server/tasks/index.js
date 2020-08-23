const Redis = require('ioredis');
const queue = require('bull');
const { setQueues } = require('bull-board');

const redisConfig = {
  port: 6379,
  host: '127.0.0.1',
  password: process.env.REDIS_AUTH,
};
const client = new Redis(redisConfig);
const subscriber = new Redis(redisConfig);

const bullConfig = {
  createClient: function (type) {
    switch (type) {
      case 'client':
        return client;
      case 'subscriber':
        return subscriber;
      case 'bclient':
        return new Redis(redisConfig);
      default:
        throw new Error('Unexpected connection type: ', type);
    }
  },
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: 5,
  },
};

const queues = {
  imgCompressor: new queue('imgCompressor', bullConfig),
  uploader: new queue('imgUploader', bullConfig),
  dbWriter: new queue('dbWriter', bullConfig),
  emailSender: new queue('sendEmailNotification', bullConfig),
  browserSender: new queue('sendBrowserNotification', bullConfig),
};

module.exports = queues;

// Make queues visible to Bull-Board monitor
// Alert about stalled jobs and move them to failed
for (const key in queues) {
  const queue = queues[key];
  setQueues(queue);

  queue.on('stalled', function (job) {
    error('stalled:', { job: job.name, file: job.data.image.originalname, userId: job.data.userId });
    // job.moveToFailed();
  });

  // queue.whenCurrentJobsFinished().then(() => {
  //   console.log('~~~~ ALL DONE :) ~~~')
  // });
}
