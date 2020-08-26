const Redis = require('ioredis');
const queue = require('bull');
const { setQueues } = require('bull-board');
const ws = require('../app').locals.ws;

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
  // queue: new queue('queue', bullConfig),
  getB2Auth: new queue('getB2Auth', bullConfig),
  imgCompressor: new queue('imgCompressor', bullConfig),
  uploader: new queue('imgUploader', bullConfig),
  dbWriter: new queue('dbWriter', bullConfig),
  emailSender: new queue('emailSender', bullConfig),
  browserSender: new queue('browserSender', bullConfig),
};
module.exports = queues;

const { getB2Auth, imgCompressor, uploader, dbWriter, emailSender, browserSender } = queues;

getB2Auth.pause();
// Pause notification processing until after thumbnail first thumbnail uploaded
emailSender.pause();
browserSender.pause();

getB2Auth.process(50, require('./getB2Auth.js'));
imgCompressor.process(50, require('./imgCompressor.js'));
uploader.process(50, require('./uploader.js'));
dbWriter.process(50, require('./dbWriter.js'));
emailSender.process(50, require('./emailSender'));
browserSender.process(50, require('./browserSender'));

uploader.on('completed', async (job, fileInfo) => {
  const { resolution, uppyFileId, fileCount } = job.data;
  // Send success response to client
  if (resolution === 'fullResX') {
    try {
      await ws.send(
        Buffer.from(
          JSON.stringify({
            // ...fileInfo,
            type: 'fileUploaded',
            msg: 'Processing...',
            uppyFileId,
            // fileInfo: fileInfo,
          })
        )
      );
    } catch (err) {
      if (!ws) {
        // await res.status(200).end();
      }
      error('ws error:', err);
    }
    // res.status(200).json(fileInfo).end();
  } else if (resolution === 'thumbRes') {
    // Thumbnail is finished uploading - resume processing notifications
    // notifications(thumbnail is in notifications so must be uploaded first)
    ws.send(
      Buffer.from(
        JSON.stringify({
          type: 'fileUploaded',
          msg: 'Processing...',
          uppyFileId,
          fileInfo: fileInfo,
        })
      )
    );
    emailSender.resume();
    browserSender.resume();
  }
});

dbWriter.on('completed', async (job, result) => {
  const truncate = (str, truncLen, separator) => {
    if (str.length <= truncLen) return str;

    separator = separator || '...';

    const sepLen = separator.length,
      charsToShow = truncLen - sepLen,
      frontChars = Math.ceil(charsToShow / 2),
      backChars = Math.floor(charsToShow / 2);

    return str.substr(0, frontChars) + separator + str.substr(str.length - backChars);
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
    error('stalled:', { job: job.name, file: job.data.image.originalname, userId: job.data.userId });
    // job.moveToFailed();
  });

  // queue.whenCurrentJobsFinished().then(() => {
  //   console.log('~~~~ ALL DONE :) ~~~')
  // });
}
