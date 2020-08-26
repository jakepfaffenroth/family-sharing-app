const axios = require('axios');
const db = require('../db').pgPromise;

const appKeyId = process.env.KEY_ID;
const applicationKey = process.env.APPLICATION_KEY;
const encodedBase64 = Buffer.from(appKeyId + ':' + applicationKey).toString('base64');

const getAuthFromDB = async () => {
  try {
    const b2Auth = await db.oneOrNone('SELECT * FROM b2_auth');
    const oneDay = 1000 * 60 * 60 * 24;

    const credsExpired = parseInt(b2Auth.timestamp) + oneDay < Date.now() ? true : false;

    if (!b2Auth || credsExpired) {
      credsExpired ? info('Expired credentials') : null;
      return getFreshAuth();
    } else {
      const credentials = {
        appKeyId: appKeyId,
        applicationKey: applicationKey,
        apiUrl: b2Auth.apiUrl,
        authorizationToken: b2Auth.authorizationToken,
        downloadUrl: b2Auth.downloadUrl,
        recommendedPartSize: b2Auth.recommendedPartSize,
      };
      success('B2 auth retrieved from DB');
      return credentials;
    }
  } catch (err) {
    error('Error retrieving B2 Auth from DB:\n', err);
  }
};

const getFreshAuth = async () => {
  info('Getting fresh upload token');
  try {
    const response = await axios.post(
      `https://api.backblazeb2.com/b2api/v2/b2_authorize_account`,
      {},
      {
        headers: { Authorization: 'Basic ' + encodedBase64 },
      }
    );
    if (response) {
      const data = response.data;
      const credentials = {
        appKeyId: appKeyId,
        applicationKey: applicationKey,
        apiUrl: data.apiUrl,
        authorizationToken: data.authorizationToken,
        downloadUrl: data.downloadUrl,
        recommendedPartSize: data.recommendedPartSize,
      };

      await db.one(
        'UPDATE b2_auth SET account_id = ${accountId}, authorization_token = ${authorizationToken}, api_url = ${apiUrl},  download_url = ${downloadUrl}, recommended_part_size = ${recommendedPartSize}, absolute_minimum_part_size = ${absoluteMinimumPartSize}, timestamp = ${timestamp} RETURNING *',
        { ...data, timestamp: Date.now() }
      );
      success('Fresh B2 auth received');
      return credentials;
    }
  } catch (err) {
    error('err: ', err.response.data); // an error occurred
  }
};

const getB2Auth = async (getNew) => {
  // if sent getNew, get fresh auth; else try record in DB first
  return getNew ? getFreshAuth() : getAuthFromDB();
};
module.exports = async (getNew) => {
  // Only get fresh auth if explicitly told to by passing in getNew as true
  try {
    return await getB2Auth(getNew ? true : false);
  } catch (err) {
    error(err);
  }
};
