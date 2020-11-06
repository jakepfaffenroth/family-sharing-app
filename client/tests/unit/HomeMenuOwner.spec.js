import { expect, should } from 'chai';
should();
import { mount, flushPromises } from '@vue/test-utils';
import { nextTick } from 'vue';
import App from '@/App';
import {
  setMountOptions,
  store,
  resetStore,
  router,
  mockAxios,
  setCookies
} from '../setup/jest.setup.js';

// const mountOptions = {
//   global: {
//     plugins: [router, store],
//     provide: {
//       toast: () => null,
//       nuke: () => null,
//       sortImages: () => null
//     },
//     stubs: {
//       HomeGuestMenu: true,
//       HomeModalGuestSubscribe: true,
//       HomeGallery: true,
//       HomeUploader: true
//     }
//   },
//   props: { userType: 'owner' },
//   data() {
//     return {
//       visibleModal: null
//     };
//   }
// };

describe('Menu buttons', () => {
  let wrapper;
  // jest.mock('@uppy/dashboard');

  // mockAxios.onGet().reply(200);
  // mockAxios.onPost().reply(200, {
  //   owner: { ownerId: 'testOwnerId' },
  //   images: [{ uploadTime: Date.now() }, { uploadTime: Date.now() }]
  // });

  beforeEach(async () => {
    setCookies();
    router.push('/');
    await router.isReady();
    wrapper = mount(
      App,
      setMountOptions({
        stubs: {
          HomeGuestMenu: true,
          HomeModalGuestSubscribe: true,
          HomeGallery: true,
          HomeUploader: true
        },
        props: { userType: 'owner' },
        data: {
          visibleModal: null
        }
      })
    );
  });

  afterEach(async () => {
    resetStore();
    await flushPromises();
    wrapper.unmount();
    // mockAxios.reset();
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

  test('logout btn deletes cookie', async () => {
    // delete window.location;
    // window.location = location;
    // Object.defineProperty(window, 'location', {
    //   value: {
    //     assign: jest.fn(),
    //     replace: jest.fn(),
    //     reload: jest.fn(),
    //     search: jest.fn()
    //   },
    //   writable: true
    // });
    // mockAxios.onGet().reply(200);
    // mockAxios.onPost().reply(200, {
    //   owner: { ownerId: 'testOwnerId' },
    //   images: [{ uploadTime: Date.now() }, { uploadTime: Date.now() }]
    // });

    setCookies();
    const wrapper = mount(
      App,
      setMountOptions({
        stubs: {
          HomeGuestMenu: true,
          HomeModalGuestSubscribe: true,
          HomeGallery: true,
          HomeUploader: true
        },
        props: { userType: 'owner' },
        data: {
          visibleModal: null
        }
      })
    );
    router.push('/');
    await router.isReady();
    await nextTick();
    await wrapper.find('[data-test="menuBtn"]').trigger('click');
    await wrapper.find('[data-test="logoutBtn"]').trigger('click');

    expect(window.document.cookie).to.not.include('ownerId=testOwnerId');
  });
});
