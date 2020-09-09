import Vuex from 'vuex';

export default Vuex.createStore({
  state: {
    b2Credentials: {},
    owner: {},
  },
  mutations: {
    setCredentials(state, cred) {
      state.b2Credentials = cred;
    },
    setOwner(state, owner) {
      state.owner = owner;
    },
  },
  actions: {},
  getters: {
    b2Credentials: (state) => state.b2Credentials,
    owner: (state) => state.owner,
  },
  modules: {},
});
