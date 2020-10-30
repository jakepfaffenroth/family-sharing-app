import { expect, should } from 'chai';
should();
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from '@/App';
import Home from '@/views/Home';
import Account from '@/views/Account';
import HomeMenuOwner from '@/components/HomeMenuOwner';

process.env.VUE_APP_SERVER = 'http://localhost:3400';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      name: 'home',
      path: '/',
      component: Home
    },
    { name: 'account', path: '/account', component: Account }
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
    planStore: { usage: { kb: 0, mb: 0, gb: 0 }, planDetails: null },
    imageStore: {
      images: [{ uploadTime: Date.now() }, { uploadTime: Date.now() }]
    }
  },
  getters: {
    ownerId: () => 'testOwnerId',
    storageValue: () => 20,
    usageValue: () => ({ num: 50, unit: 'mb' }),
    quota: () => 2000,
    usageBarColor: () => 'green-400',
    usageBarWidth: () => 'width: ' + 2 + '%'
  },
  actions: {
    saveIdCookies() {},
    getOwnerData() {}
  }
});

const toast = () => null;
const nuke = () => null;
const sortImages = () => null;

describe('Sharing', () => {
  jest.mock('@uppy/dashboard');

  Object.defineProperty(window.document, 'cookie', {
    writable: true,
    value: 'ownerId=testOwnerId'
  });

  const wrapper = mount(Home, {
    global: {
      plugins: [router, store],
      provide: { toast, nuke, sortImages },
      stubs: {
        HomeGallery: true,
        HomeUploader: true
      }
    },
    props: { userType: 'owner' },
    data() {
      return {};
    }
  });

  test('menu btn opens share modal', async () => {
    const menuBtn = wrapper.find('[data-test="menuBtn"]');
    const openShareModalBtn = wrapper.find('[data-test="openShareModalBtn"]');

    await menuBtn.trigger('click');
    await openShareModalBtn.trigger('click');
    await router.isReady();
    expect(wrapper.find('[data-test="homeModal"]').isVisible()).to.be.true;
  });

  test('correct share url is in share modal', async () => {
    const menuBtn = wrapper.find('[data-test="menuBtn"]');
    const openShareModalBtn = wrapper.find('[data-test="openShareModalBtn"]');

    await menuBtn.trigger('click');
    await openShareModalBtn.trigger('click');

    expect(wrapper.find('[data-test="homeModal"]').html()).to.include(
      'localhost:3400/testGuestId/guest'
    );
  });
});
