import { expect, should } from 'chai';
should();
import store from '@/store';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
const mockAxios = new MockAdapter(axios);

process.env.VUE_APP_SERVER = 'http://localhost:3400';

delete window.location;
window.location = { assign: jest.fn() };

describe('actions', () => {
  test('saveIdCookies', () => {
    store.dispatch('saveIdCookies', {
      ownerId: 'mockOwnerId',
      guestId: 'mockGuestId'
    });

    expect(store.state.ownerStore.ownerIdCookie).to.equal('mockOwnerId');
    expect(store.state.ownerStore.guestIdCookie).to.equal('mockGuestId');
  });

  test.each(['owner', 'guest'])(
    'getOwnerData - correct API is reached for user type "%s"',
    async userType => {
      const targetUrl =
        userType == 'owner' ? 'auth/check-session' : 'user/get-owner';
      let destUrl = null;

      mockAxios.onPost().reply(config => {
        destUrl = config.url;
        return [
          200,
          {
            owner: { ownerId: 'mockOwnerId', mock: userType, isLoggedIn: true }
          }
        ];
      });

      const data = { id: 'mockOwnerId', userType };

      await store.dispatch('getOwnerData', data);

      expect(destUrl).to.include(targetUrl);
      expect(store.state.ownerStore.owner.mock).to.equal(userType);
    }
  );
});
