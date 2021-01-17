import http from '../utils/http';

export default {
  state: {
    ownerIdCookie: '',
    guestIdCookie: '',
    owner: {},
    subscribers: []
  },
  getters: {
    owner: state => state.owner,
    isAuth: state => state.owner.isAuth,
    isPremium: state =>
      state.owner.plan ? state.owner.plan.includes('premium') : null,
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
    },
    updateSubscribers(state, subscribers) {
      state.subscribers = subscribers;
    },
    updateQuota(state, quota) {
      state.owner.quota = quota;
    }
  },
  actions: {
    saveIdCookies({ commit }, { ownerId, guestId }) {
      commit('saveIdCookies', { ownerId, guestId });
    },
    async getOwnerData({ commit, dispatch, state }, { id, userType }) {
      let url = '';
      switch (userType) {
        case 'owner':
          url = 'auth/check-session';
          id = { ownerId: id };
          break;
        case 'guest':
          url = 'user/get-owner';
          id = { guestId: id };
          break;
      }

      try {
        // console.log('id, usertype:', id, userType);
        // Fetch usage data
        // if (userType === 'owner') {
        //   await dispatch('getUsageData', id);
        // }
        // Fetch owner data
        const { data } = await http.post(url, id);
        // Redirect to accountCompletion page if no plan was chosen
        if (userType === 'owner' && data.owner.plan === null) {
          window.location.assign('/complete-signup');
        }
        // Redirect to login page if owner is not signed in
        if (userType === 'owner' && !data.isLoggedIn) {
          window.location.assign(`${process.env.VUE_APP_SERVER}/login`);
          return;
        }
        commit('updateOwner', data.owner);
        commit('updateImages', data.images);
        dispatch('updateAlbums', data.albums);
      } catch (err) {
        console.error(err, state);
      }
    },
    async getSubscribers({ commit, rootGetters }) {
      const response = await http.post('/user/get-subscribers', {
        ownerId: rootGetters.ownerId
      });
      console.log('subscribers:', response);

      commit('updateSubscribers', response.data);
    },
    updateQuota({ commit }, quota) {
      commit('updateQuota', quota);
    }
  }
};
