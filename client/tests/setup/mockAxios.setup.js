import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
const mockAxios = new MockAdapter(axios, { onNoMatch: 'throwException' });
import { owner, images, albums } from './mockState.setup';
import { resetStore } from './jest.setup';

mockAxios.onAny().reply(config => {
  // console.log('config.url:', config.url);
  let response;
  switch (config.url.split('/').pop()) {
    case 'get-usage':
      resetStore();
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
  }
  return response;
});

export default mockAxios;
