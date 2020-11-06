import { store, router } from './jest.setup';

import { Notyf } from 'notyf';
jest.mock('notyf');
const toast = new Notyf();

const mountOptions = {
  global: {
    plugins: [router, store],
    provide: {
      toast,
      nuke: () => null,
      sortImages: () => null
    },
    stubs: {
      // Stubs should be defined individually for each test/describe block
    }
  },
  slots: {},
  props: {},
  data() {
    return {
      toast: jest.fn(() => ({
        open: () => {}
      }))
    };
  }
};

function setMountOptions(customOptions) {
  customOptions = customOptions || {};
  customOptions.plugins = customOptions.plugins || [];
  const attachTo = customOptions.attachTo || null;
  const global = {
    plugins: [router, store],
    provide: { ...mountOptions.global.provide, ...customOptions.provide },
    stubs: { ...mountOptions.global.stubs, ...customOptions.stubs }
  };
  const slots = { ...mountOptions.slots, ...customOptions.slots };
  const props = { ...mountOptions.props, ...customOptions.props };
  const data = customOptions.data || {};
  return {
    attachTo,
    global,
    slots,
    props,
    data() {
      return data;
    }
  };
}

export default setMountOptions;
