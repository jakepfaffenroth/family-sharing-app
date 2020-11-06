import { expect, should } from 'chai';
should();
import { flushPromises, mount } from '@vue/test-utils';
import App from '@/App';
import AccountSummary from '@/components/AccountSummary';
import { nextTick } from 'vue';
import {
  setMountOptions,
  store,
  resetStore,
  router,
  mockAxios,
  setCookies
} from '../setup/jest.setup.js';

describe('change plan', () => {
  let wrapper;

  beforeEach(async () => {
    setCookies();
    router.push('/account');
    await router.isReady();
    wrapper = mount(
      App,
      setMountOptions({
        stubs: {
          HomeGallery: true,
          HomeUploader: true
        }
      })
    );
    await store.dispatch('getPlanDetails');
  });

  afterEach(async () => {
    resetStore();
    await router.replace('/');
    await router.isReady();
    wrapper.unmount();
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('change plan button navigates to plan picker', async () => {
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
