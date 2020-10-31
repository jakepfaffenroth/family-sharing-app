const server = process.env.VUE_APP_SERVER;
import axios from 'axios';

export default {
  state: {
    ownerIdCookie: '',
    guestIdCookie: '',
    owner: {}
  },
  getters: {
    owner: state => state.owner,
    ownerId: state => state.owner.ownerId,
    guestId: state => state.owner.guestId
  },
  mutations: {
    saveIdCookies(state, { ownerId, guestId }) {
      state.ownerIdCookie = ownerId;
      state.guestIdCookie = guestId;
    },
    updateOwner(state, ownerData) {
      state.owner = ownerData;
    }
  },
  actions: {
    saveIdCookies({ commit }, { ownerId, guestId }) {
      commit('saveIdCookies', { ownerId, guestId });
    },
    async getOwnerData({ commit, dispatch }, { id, userType }) {
      let url = '';
      switch (userType) {
        case 'owner':
          url = `${server}/auth/check-session`;
          id = { ownerId: id };
          break;
        case 'guest':
          url = `${server}/user/get-owner`;
          id = { guestId: id };
          break;
      }

      try {
        // Fetch usage data
        if (userType == 'owner') {
          dispatch('getUsageData', id);
        }

        // Fetch owner data
        const response = await axios.post(url, id);
        // Redirect to login page if owner is not signed in
        if (userType === 'owner' && !response.data.isLoggedIn) {
          window.location.assign(`${server}/login`);
        }
        commit('updateOwner', response.data.owner);
        commit('updateImages', response.data.images);
      } catch (err) {
        console.error('error:', err);
      }
    }
  }
};
