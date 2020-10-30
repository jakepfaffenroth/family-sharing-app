import { expect, should } from 'chai';
should();
import { flushPromises, mount } from '@vue/test-utils';
import App from '@/App';
import Home from '@/views/Home';
import Account from '@/views/Account';
import { nextTick } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import { createStore } from 'vuex';
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
      usage: { kb: 10, mb: 20, gb: 30 },
      planDetails: { plan: 'Basic', paymentMethod: 'Visa •••• 4242' }
    },
    imageStore: {
      images: [{ uploadTime: Date.now() }, { uploadTime: Date.now() }]
    }
  },
  getters: {
    ownerId: () => 'testOwnerId',
    images: state => state.imageStore.images,
    planDetails: state => state.planStore.planDetails,
    storageValue: () => 20,
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

jest.mock('reconnecting-websocket');

const mountOptions = {
  global: {
    plugins: [router, store],
    provide: {
      toast: () => null,
      nuke: () => null,
      sortImages: () => null
    },
    stubs: {
      HomeGallery: true,
      HomeUploader: true,
      AccountPlanPickerButton: true
    }
  },
  data() {
    return {
      toast: jest.fn(() => {
        open: () => {};
      })
    };
  }
};

const setCookies = () => {
  Object.defineProperty(window.document, 'cookie', {
    writable: true,
    value: 'ownerId=testOwnerId'
  });
};

describe('Initialization', () => {
  let wrapper;
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
    await router.replace('/');
    await router.isReady();
    wrapper.unmount();
    mockAxios.reset();
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('renders Home component', async () => {
    const home = wrapper.findComponent({ name: 'Home' });
    expect(home.exists()).to.be.true;
  });

  test('renders owner menu', async () => {
    await nextTick();

    expect(wrapper.text()).to.include('Upload Files');
  });
});

describe('Routing', () => {
  let wrapper;

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
    await router.replace('/');
    await router.isReady();
    wrapper.unmount();
    mockAxios.reset();
    jest.resetModules();
    jest.clearAllMocks();
  });

  // Object.defineProperty(window.document, 'cookie', {
  //   writable: true,
  //   value: 'ownerId=testOwnerId'
  // });

  // const wrapper = mount(App, mountOptions);

  test('router navigates to Account view', async () => {
    router.push('/account');
    await router.isReady();
    await flushPromises();

    expect(wrapper.findComponent({ name: 'Account' }).exists()).to.be.true;
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

test('logout deletes cookie', async () => {
  // delete window.location;
  // window.location = location;
  Object.defineProperty(window, 'location', {
    value: {
      assign: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
      search: jest.fn()
    },
    writable: true
  });
  mockAxios.onGet().reply(200);
  mockAxios.onPost().reply(200, {
    owner: { ownerId: 'testOwnerId' },
    images: [{ uploadTime: Date.now() }, { uploadTime: Date.now() }]
  });

  setCookies();
  const wrapper = mount(App, mountOptions);
  router.push('/');
  await router.isReady();
  await nextTick();
  await wrapper.find('[data-test="menuBtn"]').trigger('click');
  await wrapper.find('[data-test="logoutBtn"]').trigger('click');

  expect(window.document.cookie).to.not.include('ownerId=testOwnerId');
});
