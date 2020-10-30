import { expect, should } from 'chai';
should();
import { flushPromises, mount } from '@vue/test-utils';
import App from '@/App';
import Home from '@/views/Home';
import Account from '@/views/Account';
import { nextTick } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import { createStore } from 'vuex';
import rws from 'reconnecting-websocket';
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
    getPlanDetails() {},
    getUsageData() {},
    removeFromImages({ commit, state }, imgToRemove) {
      const indexToRemove = state.imageStore.images.findIndex(
        x => x.fileId === imgToRemove.fileId
      );
      state.imageStore.images.splice(indexToRemove, 1);
    }
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
    stubs: {}
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

describe('images update in display', () => {
  let wrapper;
  // jest.mock('axios', () => ({
  //   get: () => Promise.resolve({ data: { ownerId: 'testOwnerId' } }),
  //   post: () =>
  //     Promise.resolve({
  //       status: 200
  //     })
  // }));

  beforeEach(async () => {
    setCookies();
    router.push('/');
    await router.isReady();
    wrapper = mount(App, mountOptions);
  });

  afterEach(async () => {
    // await router.replace('/');
    // await router.isReady();
    wrapper.unmount();
    jest.resetModules();
    jest.clearAllMocks();
    mockAxios.reset();
    store.state.imageStore.images = [
      { fileId: '1', uploadTime: Date.now() },
      { fileId: '2', uploadTime: Date.now() }
    ];
  });

  test('gallery displays if images exist', async () => {
    expect(wrapper.find('[data-test="gallery"]').exists()).to.be.true;
  });

  test('displays new image after adding to state', async () => {
    store.state.imageStore.images.push({
      uploadTime: Date.now(),
      src: 'newImg',
      thumbnail: 'newImg'
    });
    await nextTick();
    expect(wrapper.find('[src="newImg"]').exists()).to.be.true;
  });

  test('delete confirmation modal displays', async () => {
    store.state.imageStore.images.push({
      uploadTime: Date.now(),
      src: 'newImg',
      thumbnail: 'newImg'
    });

    await nextTick();
    await wrapper.find('[src="newImg"]').trigger('hover');
    await wrapper.find('[data-test="imgDeleteBtn"]').trigger('click');

    expect(wrapper.find('[data-test="homeModal"]').text()).to.include(
      'Are you sure you want to delete this image?'
    );
  });

  test('removes image from display after removing from state', async () => {
    store.state.imageStore.images.push({
      uploadTime: Date.now(),
      src: 'newImg',
      thumbnail: 'newImg'
    });
    const index = store.state.imageStore.images.findIndex(
      x => x.src === 'newImg'
    );

    await nextTick();
    expect(wrapper.find('[src="newImg"]').exists()).to.be.true;
    store.state.imageStore.images.splice(index, 1);
    await nextTick();

    expect(wrapper.find('[src="newImg"]').exists()).to.be.false;
  });

  test('removes image from display after deletion', async () => {
    mockAxios.onPost().reply(200);
    store.state.imageStore.images.push({
      fileId: '3',
      uploadTime: Date.now(),
      src: 'newImg',
      thumbnail: 'newImg'
    });

    await nextTick();
    expect(wrapper.find('[src="newImg"]').exists()).to.be.true;

    await wrapper.find('[src="newImg"]').trigger('hover');
    await wrapper
      .find('[src="newImg"]')
      .find('[data-test="imgDeleteBtn"]')
      .trigger('click');
    await wrapper.find('[data-test="confirmDeleteBtn"]').trigger('click');
    await flushPromises();

    expect(wrapper.find('[src="newImg"]').exists()).to.be.false;
  });

  
});
