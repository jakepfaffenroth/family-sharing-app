import { expect, should } from 'chai';
should();
import { flushPromises, mount } from '@vue/test-utils';
import App from '@/App';
import Home from '@/views/Home';
import Account from '@/views/Account';
import downloadZip from '@/utils/downloadZip';
import { nextTick } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import { createStore } from 'vuex';
import { Notyf } from 'notyf';
import rws from 'reconnecting-websocket';
import axios from 'axios';
import format from 'date-fns/format';
import MockAdapter from 'axios-mock-adapter';
const mockAxios = new MockAdapter(axios);
import mockImage from '../assets/mockImage.jpg';

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
      images: [
        { uploadTime: Date.now().toString(), exif: {} },
        { uploadTime: Date.now().toString(), exif: {} }
      ]
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
    value: 'ownerId=mockOwnerId'
  });
};

describe('images update in display', () => {
  let wrapper;

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
      { fileId: '1', uploadTime: Date.now().toString() },
      { fileId: '2', uploadTime: Date.now().toString() }
    ];
  });

  test('gallery displays if images exist', async () => {
    expect(wrapper.find('[data-test="gallery"]').exists()).to.be.true;
  });

  test('displays new image after adding to state', async () => {
    store.state.imageStore.images.push({
      uploadTime: Date.now().toString(),
      src: 'newImg',
      thumbnail: 'newImg'
    });
    await nextTick();
    expect(wrapper.find('[src="newImg"]').exists()).to.be.true;
  });

  test('delete confirmation modal displays', async () => {
    store.state.imageStore.images.push({
      uploadTime: Date.now().toString(),
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
      uploadTime: Date.now().toString(),
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
      uploadTime: Date.now().toString(),
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

describe('group images by date', () => {
  let wrapper;
  const uploadTime = Date.now().toString;

  beforeEach(async () => {
    setCookies();
    router.push('/');
    await router.isReady();
    store.state.imageStore.images = [];
    wrapper = mount(App, mountOptions);
  });

  afterEach(async () => {
    // await router.replace('/');
    // await router.isReady();
    wrapper.unmount();
    jest.resetModules();
    jest.clearAllMocks();
    mockAxios.reset();
    store.state.imageStore.images = [];
  });

  test.each([
    [[new Date(Date.now()), new Date(Date.now())]],
    [[new Date(Date.now()), new Date('1/21/2000')]],
    [
      [
        new Date('1/21/2000'),
        new Date('1/21/2000'),
        new Date('5/13/2005'),
        new Date('5/13/2005'),
        new Date('9/26/1986')
      ]
    ],
    [[null, null]],
    [[new Date('1/21/2000'), new Date('1/21/2000'), null]],
    [[null, new Date('1/21/2000'), new Date('1/21/2050')]]
  ])('images should be grouped by date', async dates => {
    // store.state.imageStore.images = [];

    dates.forEach(date => {
      store.state.imageStore.images.push({
        exif: date
          ? { exif: { DateTimeOriginal: date.toLocaleString() } }
          : null,
        uploadTime: Date.now().toString(),
        src: 'mockUrl'
      });
    });

    await nextTick();

    const gallery = wrapper.find('[data-test="gallery"]');
    dates.forEach(date => {
      expect(gallery.text()).to.include(
        format(date ? date : new Date(Date.now()), 'E, LLL d')
      );
    });
  });
});

describe('download images', () => {
  let wrapper;
  let mockImage;
  async function toDataURL(src, callback) {
    var image = new Image();
    image.crossOrigin = 'Anonymous';

    image.onload = function() {
      var canvas = document.createElement('canvas');
      var context = canvas.getContext('2d');
      canvas.height = this.naturalHeight;
      canvas.width = this.naturalWidth;
      context.drawImage(this, 0, 0);
      var dataURL = canvas.toDataURL('image/jpeg');
      callback(dataURL);
    };

    image.src = src;
  }

  // const mockImage = new Blob(
  //   // Math.pow(123456789123456789, 10000)
  //   //   .toString()
  //   //   .split(''),
  //   ['1', '2', '3'],
  //   {
  //     type: 'image/jpeg'
  //   }
  // );

  // mockImage['name'] = 'mockImage.jpg';

  mockAxios.onGet().reply(200, mockImage);
  mockAxios.onPost().reply(200, {
    owner: { ownerId: 'testOwnerId' },
    images: [
      { uploadTime: Date.now().toString() },
      { uploadTime: Date.now().toString() }
    ]
  });

  beforeEach(async () => {
    setCookies();
    router.push('/');
    await router.isReady();
    wrapper = mount(App, mountOptions);
  });

  afterEach(async () => {
    wrapper.unmount();
    jest.resetModules();
    jest.clearAllMocks();
    mockAxios.reset();
    store.state.imageStore.images = [
      { fileId: '1', uploadTime: Date.now().toString() },
      { fileId: '2', uploadTime: Date.now().toString() }
    ];
  });

  test.skip('downloads zip file', async () => {
    // TODO - Fix this test
    await toDataURL('../assets/mockImage.jpg', function(dataURL) {
      // do something with dataURL
      mockImage = dataURL;
    });
    console.log('mockImage:', mockImage);
    jest.mock('notyf');
    const toast = new Notyf();

    const progress = await downloadZip([{ fileName: 'mockImage.jpg' }], toast);
    console.log('progress:', progress);

    expect(progress).to.equal(mockImage);
  });
});
