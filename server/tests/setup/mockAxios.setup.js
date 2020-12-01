const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const mockAxios = new MockAdapter(axios, { onNoMatch: 'throwException' });
const { owner, images, albums } = require('./mockState.setup');

mockAxios.onAny().reply((config) => {
  // console.log('config.url:', config.url);
  let response;
  switch (config.url.split('/').pop()) {
    case 'get-usage':
      response = [200, { kb: 10, mb: 20, gb: 30 }];
      break;
    case 'check-session':
      response = [200, { owner, images, albums, isLoggedIn: true }];
      break;
    case 'update-subscription':
      response = [200, { subUpdated: true, msg: 'none' }];
      break;
    case 'get-owner':
      response = [200, { owner, images, albums }];
      break;
    case 'retrieve-payment-method':
      response = [200, { plan: 'Basic', paymentMethod: 'Visa **** mockCard' }];
      break;
    case 'delete-image':
      response = [200, {}];
      break;
    case 'logout':
      response = [200, {}];
      break;
    case 'add-to-albums':
      response = [200, { result: 'result' }];
      break;
  }
  return response;
});

module.exports = mockAxios;
