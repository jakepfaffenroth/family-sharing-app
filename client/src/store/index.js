import { createStore } from 'vuex';
import ownerStore from './ownerStore';
import imageStore from './imageStore';
import planStore from './planStore';

const initialState = JSON.stringify({
  ownerStore: ownerStore.state,
  imageStore: imageStore.state,
  planStore: planStore.state
});

export default createStore({
  state: {},
  getters: {},
  mutations: {
    RESET_STATE(state) {
      //Convert string in object
      let copyState = JSON.parse(initialState);
      Object.keys(state).forEach(key => {
        Object.assign(state[key], copyState[key]);
      });
    }
  },
  actions: {
    RESET_STATE({ commit }) {
      commit('RESET_STATE');
    }
  },
  modules: {
    ownerStore,
    imageStore,
    planStore
  }
});
