import Vuex from 'vuex';

export default Vuex.createStore({
  state: {
    b2Credentials: {},
    user: {},
  },
  mutations: {
    setCredentials(state, cred) {
      state.b2Credentials = cred;
    },
    setUser(state, user) {
      state.user = user;
    },
  },
  actions: {},
  getters: {
    b2Credentials: (state) => state.b2Credentials,
    user: (state) => state.user,
  },
  modules: {},
});
