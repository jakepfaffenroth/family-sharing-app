import { createStore } from 'vuex';

const store = {
  namespaced: true,
  state: {
    ownerStore: {
      owner: {
        ownerId: 'testOwnerId',
        username: 'alice',
        firstName: 'Alice',
        lastName: 'Doe'
      }
    },
    imageStore: { images: [] }
  },
  getters: {
    storageValue: () => 20,
    usageValue: () => ({ num: 50, unit: 'mb' }),
    quota: () => 2000,
    usageBarColor: () => 'green-400',
    usageBarWidth: () => 'width: ' + 2 + '%'
  }
};


const debug = process.env.NODE_ENV !== 'production';

export default createStore({
  modules: {
    store
  },
  strict: debug
});
