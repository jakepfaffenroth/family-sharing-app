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
  actions: {
    setCredentials({ commit }) {
      console.log('cred from action 1: ', this.state.b2Credentials);
      commit('setCredentials');
      console.log('cred from action 2: ', this.state.b2Credentials);
    },
  },
  getters: {
    b2Credentials: (state) => state.b2Credentials,
    user: (state) => state.user,
  },
  modules: {},
});
