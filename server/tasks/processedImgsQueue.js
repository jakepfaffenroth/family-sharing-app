module.exports = async (req, res) => {
  const { processedImgsQueue, uploader } = require('./index');

  processedImgsQueue.process('processedImgsQueue', async (job) => {
    await uploader.add('imgUploader', job.data);
    return;
  });
};
