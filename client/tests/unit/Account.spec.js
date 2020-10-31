import { expect, should } from 'chai';
should();
import { flushPromises, mount } from '@vue/test-utils';
import App from '@/App';
import Home from '@/views/Home';
import Account from '@/views/Account';
import AccountSummary from '@/components/AccountSummary';
import { nextTick } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import { createStore } from 'vuex';

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
      usage: { kb: 0, mb: 0, gb: 0 },
      planDetails: { plan: 'Basic', paymentMethod: 'Visa •••• 4242' }
    },
    imageStore: {
      images: [{ uploadTime: Date.now() }, { uploadTime: Date.now() }]
    }
  },
  getters: {
    ownerId: () => 'testOwnerId',
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
    getPlanDetails() {
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
    stubs: {
      HomeGallery: true,
      HomeUploader: true
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

delete window.location;
window.location = { assign: jest.fn() };

describe('change plan', () => {
  let wrapper;

  Object.defineProperty(window, 'scrollTo', {
    value: jest.fn(),
    writable: true
  });

  jest.mock('axios', () => ({
    get: () => Promise.resolve({ data: { ownerId: 'testOwnerId' } }),
    post: () => {
      console.log('in mock axios');
      Promise.resolve({
        data: { subUpdated: true, msg: 'none' }
      });
    }
  }));

  beforeEach(async () => {
    router.push('/account');
    await router.isReady();
    wrapper = mount(App, mountOptions);
  });

  afterEach(async () => {
    await router.replace('/');
    await router.isReady();
    wrapper.unmount();
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('change plan button opens plan picker', async () => {
    await wrapper.find('[data-test="changePlanBtn"]').trigger('click');
    await flushPromises();

    expect(wrapper.text()).to.include('Change your plan');
  });

  test('choosing new plan opens confirmation', async () => {
    await wrapper.find('[data-test="changePlanBtn"]').trigger('click');
    // await flushPromises();
    await wrapper.find('[data-test="premiumBtn"]').trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-test="planChangeConfirmation"]').isVisible()).to
      .be.true;
  });

  test('account summary updates after choosing new plan', async () => {
    expect(wrapper.find('[data-test="currentPlanInSummary"]').text()).to.equal(
      'Basic'
    );
    await wrapper.find('[data-test="changePlanBtn"]').trigger('click');
    await nextTick();

    expect(wrapper.find('[data-test="premiumBtn"]').text()).to.include(
      'Select'
    );

    await wrapper.find('[data-test="premiumBtn"]').trigger('click');
    await wrapper.find('[data-test="confirmPlanChangeBtn"]').trigger('click');
    await flushPromises();
    store.state.planStore.planDetails = {
      plan: 'Premium',
      paymentMethod: 'mock'
    };
    wrapper.findComponent({ name: 'Account' }).vm.accountView = AccountSummary;
    await nextTick();
    expect(wrapper.find('[data-test="currentPlanInSummary"]').text()).to.equal(
      'Premium'
    );
    await wrapper.find('[data-test="changePlanBtn"]').trigger('click');
    await nextTick();

    expect(wrapper.find('[data-test="premiumBtn"]').text()).to.include(
      'Current'
    );
  });
});

// TODO - tests for deleting account