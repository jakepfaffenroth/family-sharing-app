import { expect, should } from 'chai';
should();
import { flushPromises, mount } from '@vue/test-utils';
import Home from '@/views/Home';
import BaseDropMenu from '@/components/BaseDropMenu';
import { nextTick, h } from 'vue';
import {
  setMountOptions,
  store,
  router,
  mockAxios,
  setCookies
} from '../setup/jest.setup.js';

describe('BaseDropMenu', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(BaseDropMenu, {
      attachTo: document.getElementById('app'),
      slots: {
        default: 'Default',
        listItems: h('ul', {}, [
          h('a', {}, 'Mock link'),
          h('a', {}, 'Mock link'),
          h('a', {}, 'Mock link')
        ])
      }
    });
  });

  afterEach(() => {
    wrapper.unmount();
  });

  test('drop menu opens', async () => {
    expect(wrapper.find('[data-test="baseDropMenuList"]').isVisible()).to.be
      .false;

    await wrapper.find('[data-test="openBaseDropMenu"]').trigger('click');

    expect(wrapper.find('[data-test="baseDropMenuList"]').isVisible()).to.be
      .true;
  });

  test('drop menu closes on mouseleave', async () => {
    wrapper.vm.isMenuVisible = true;
    await nextTick();
    expect(wrapper.find('[data-test="baseDropMenuList"]').isVisible()).to.be
      .true;

    await wrapper.find('[data-test="baseDropMenu"]').trigger('mouseleave');

    expect(wrapper.find('[data-test="baseDropMenuList"]').isVisible()).to.be
      .false;
  });

  test('drop menu closes on list item click', async () => {
    wrapper.vm.isMenuVisible = true;
    await nextTick();
    expect(wrapper.find('[data-test="baseDropMenuList"]').isVisible()).to.be
      .true;

    await wrapper.find('[data-test="baseDropMenuList"] a').trigger('click');
    await nextTick();

    expect(wrapper.find('[data-test="baseDropMenuList"]').isVisible()).to.be
      .false;
  });
});

describe('modals', () => {
  let wrapper;
  // jest.mock('@uppy/dashboard');

  beforeEach(async () => {
    setCookies();
    router.push('/');
    await router.isReady();
    wrapper = mount(
      Home,
      setMountOptions({
        stubs: {
          HomeGallery: true,
          HomeUploader: true
        },
        props: { userType: 'owner' },
        data: {
          visibleModal: null,
          imgInfo: null
        }
      })
    );
  });

  afterEach(async () => {
    store.dispatch('RESET_STATE');
    await router.replace('/');
    await router.isReady();
    wrapper.unmount();
    // mockAxios.reset();
    jest.resetModules();
    jest.clearAllMocks();
  });

  test.each([
    ['HomeModalShare'],
    ['HomeModalDeleteImage'],
    ['HomeModalGuestSubscribe']
  ])('click outside %s modal closes modal', async modalName => {
    if (modalName.includes('GuestSubscribe')) {
      wrapper.setProps({ userType: 'guest' });
      await store.dispatch('getOwnerData', {
        ownerId: 'mockOwnerId',
        userType: 'guest'
      });
    } else {
      await store.dispatch('getOwnerData', {
        ownerId: 'mockOwnerId',
        userType: 'owner'
      });
    }
    if (modalName.includes('Delete')) {
      wrapper.vm.imgInfo = { fileId: '1' };
    }
    wrapper.vm.visibleModal = modalName;
    await nextTick();
    // console.log('wrapper.exists():', wrapper.exists());
    // console.log('wrapper.html():', wrapper.html());
    expect(wrapper.find('[data-test="modal"]').exists()).to.be.true;

    await wrapper.find('[data-test="modalBackdrop"]').trigger('click');
    // await flushPromises();
    await nextTick();

    expect(wrapper.find('[data-test="modal"]').exists()).to.be.false;
  });
});
