import { expect, should } from 'chai';
should();
import { mount, flushPromises } from '@vue/test-utils';
import { nextTick } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from '@/App';
import Home from '@/views/Home';
import Account from '@/views/Account';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
const mockAxios = new MockAdapter(axios);

process.env.VUE_APP_SERVER = 'http://localhost:3400';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      name: 'home',
      path: '/',
      component: Home,
      props: true
    },
    {
      name: 'account',
      path: '/account',
      component: Account,
      props: true
    }
  ]
});

import { createStore } from 'vuex';
const store = createStore({
  state: {
    ownerStore: {
      owner: {
        ownerId: 'testOwnerId',
        username: 'alice',
        firstName: 'Alice',
        lastName: 'Doe',
        guestId: 'testGuestId'
      },
      ownerIdCookie: '',
      guestIdCookie: ''
    },
    planStore: {
      usage: { kb: 0, mb: 0, gb: 0 },
      planDetails: { plan: 'Basic', paymentMethod: 'Visa •••• 4242' }
    },
    imageStore: {
      images: [{ uploadTime: Date.now() }, { uploadTime: Date.now() }]
    }
  },
  getters: {
    ownerId: () => 'testOwnerId',
    storageValue: () => 20,
    planDetails: state => state.planStore.planDetails,
    usageValue: () => ({ num: 50, unit: 'mb' }),
    quota: () => 2000,
    usageBarColor: () => 'green-400',
    usageBarWidth: () => 'width: ' + 2 + '%'
  },
  actions: {
    saveIdCookies() {},
    getOwnerData() {},
    getPlanDetails() {}
  }
});

const mountOptions = {
  global: {
    plugins: [router, store],
    provide: {
      toast: () => null,
      nuke: () => null,
      sortImages: () => null
    },
    stubs: {
      HomeGuestMenu: true,
      HomeModalGuestSubscribe: true,
      HomeGallery: true,
      HomeUploader: true
    }
  },
  props: { userType: 'owner' },
  data() {
    return {
      visibleModal: null
    };
  }
};

jest.mock('reconnecting-websocket');

const setCookies = () => {
  Object.defineProperty(window.document, 'cookie', {
    writable: true,
    value: 'ownerId=testOwnerId'
  });
};

delete window.location;
window.location = {
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn()
};

Object.defineProperty(window, 'history', {
  value: {
    replaceState: jest.fn()
  },
  writable: true
});

Object.defineProperty(window, 'scrollTo', {
  value: jest.fn(),
  writable: true
});

describe('Menu buttons', () => {
  let wrapper;
  jest.mock('@uppy/dashboard');

  mockAxios.onGet().reply(200);
  mockAxios.onPost().reply(200, {
    owner: { ownerId: 'testOwnerId' },
    images: [{ uploadTime: Date.now() }, { uploadTime: Date.now() }]
  });

  beforeEach(async () => {
    setCookies();
    router.push('/');
    await router.isReady();
    wrapper = mount(App, mountOptions);
  });

  afterEach(async () => {
    await flushPromises();
    wrapper.unmount();
    mockAxios.reset();
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('menu btn opens share modal', async () => {
    await wrapper.find('[data-test="menuBtn"]').trigger('click');
    await wrapper.find('[data-test="openShareModalBtn"]').trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-test="homeModal"]').isVisible()).to.be.true;
    expect(wrapper.find('[data-test="homeModal"]').text()).to.include('Share');
  });

  test('menu btn navigates to Account view', async () => {
    await wrapper.find('[data-test="menuBtn"]').trigger('click');
    await wrapper.find('[data-test="accountBtn"]').trigger('click');
    await flushPromises();

    expect(wrapper.findComponent({ name: 'Account' }).exists()).to.be.true;
  });

  test('menu btn navigates to Get More Storage', async () => {
    await wrapper.find('[data-test="menuBtn"]').trigger('click');
    await wrapper.find('[data-test="getMoreStorageBtn"]').trigger('click');
    await flushPromises();

    expect(wrapper.text()).to.include('Change your plan');
  });
});
