const Redis = require('ioredis');
const queue = require('bull');
const { setQueues } = require('bull-board');
const app = require('../app.js');

const redisConfig = {
  port: 6379,
  host: '127.0.0.1',
  password: process.env.REDIS_AUTH,
};
const client = new Redis(redisConfig).setMaxListeners(50);
const subscriber = new Redis(redisConfig).setMaxListeners(50);

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
  prefix: 'worker',
};
const queues = {
  getB2Auth: new queue('getB2Auth', bullConfig),
  uploader: new queue('imgUploader', bullConfig),
  dbWriter: new queue('dbWriter', bullConfig),
  verifyGuestEmailSender: new queue('verifyGuestEmailSender', bullConfig),
  confirmOwnerEmailSender: new queue('confirmOwnerEmailSender', bullConfig),
  notificationEmailSender: new queue('notificationEmailSender', bullConfig),
  browserSender: new queue('browserSender', bullConfig),
};
module.exports = queues;

const {
  getB2Auth,
  uploader,
  dbWriter,
  verifyGuestEmailSender,
  confirmOwnerEmailSender,
  notificationEmailSender,
  browserSender,
} = queues;

getB2Auth.pause();
// Pause notification processing until after first thumbnail uploaded
notificationEmailSender.pause();
browserSender.pause();

getB2Auth.process(require('./getB2Auth.js'));
dbWriter.process(require('./dbWriter.js'));
uploader.process(require('./uploader.js'));
notificationEmailSender.process(require('./emailSender').emailNotification);
verifyGuestEmailSender.process(require('./emailSender').guestVerification);
confirmOwnerEmailSender.process(require('./emailSender').ownerConfirmation);
browserSender.process(require('./browserSender'));

uploader.on('completed', async (job, fileInfo) => {
  // Counter defined in fileRouter /upload
  // Track file completions in the counter
  // When counter reaches zero, send msg to client
  app.locals.uploadCounter--;
  if (app.locals.uploadCounter === 0) {
    const ws = app.locals.ws;
    ws.send('uploadsComplete');
  }
  notificationEmailSender.resume();
  browserSender.resume();
});

dbWriter.on('failed', function (job, err) {
  error(job.data.fileName + '\n' + err);
});

dbWriter.on('completed', async (job, result) => {
  const truncate = (str, truncLen, separator) => {
    if (str.length <= truncLen) return str;

    separator = separator || '...';

    const sepLen = separator.length,
      charsToShow = truncLen - sepLen,
      frontChars = Math.ceil(charsToShow / 2),
      backChars = Math.floor(charsToShow / 2);

    return (
      str.substr(0, frontChars) + separator + str.substr(str.length - backChars)
    );
  };

  const loggingFileName = (str, truncLen) => {
    const filenameArr = str.split('/').slice(1);
    filenameArr[1] = truncate(filenameArr[1], truncLen);
    return filenameArr.reverse().join(' - ');
  };

  success(`Wrote -- ${loggingFileName(job.data.fileName, 30)}`);
});

// Make queues visible to Bull-Board monitor
// Alert about stalled jobs and move them to failed
for (const key in queues) {
  const queue = queues[key];
  setQueues(queue);

  queue.on('stalled', function (job) {
    error('stalled: %o', {
      job: job.name,
      file: job.data.image,
      ownerId: job.data.ownerId,
    });
  });
}
