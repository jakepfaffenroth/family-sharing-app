import { createStore } from 'vuex';
import ownerStore from './ownerStore';
import imageStore from './imageStore';
import planStore from './planStore';

export default createStore({
  state: {},
  getters: {},
  mutations: {},
  actions: {},
  modules: {
    ownerStore,
    imageStore,
    planStore
  }
});
