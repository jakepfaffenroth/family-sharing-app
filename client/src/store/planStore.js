const server = process.env.VUE_APP_SERVER;
import axios from 'axios';

export default {
  state: { usage: { kb: 0, mb: 0, gb: 0 }, planDetails: null },
  getters: {
    quota: (state, getters, rootState) => rootState.ownerStore.owner.quota,
    premiumUser: (state, getters, rootState) =>
      rootState.ownerStore.owner.premiumUser,
    planDetails: state => state.planDetails,
    storagePercentage: (state, getters, rootState) => {
      return (state.usage.mb / rootState.ownerStore.owner.quota) * 100;
    },
    usageValue: state => {
      if (state.usage.gb >= 1)
        return { num: state.usage.gb.toFixed(2), unit: 'GB' };
      else if (state.usage.mb >= 1)
        return { num: state.usage.mb.toFixed(2), unit: 'MB' };
      else return { num: state.usage.kb.toFixed(2), unit: 'KB' };
    },
    usageBarWidth: (state, getters) => {
      return getters.storagePercentage > 2
        ? 'width: ' + getters.storagePercentage + '%'
        : 'width: ' + 2 + '%';
    },
    usageBarColor: (state, getters) => {
      if (getters.storagePercentage < 40) {
        return 'green-400';
      } else if (getters.storagePercentage < 90) {
        return 'orange-400';
      } else {
        return 'red-500';
      }
    }
  },
  mutations: {
    updateUsage(state, usageData) {
      state.usage = usageData;
    },
    updatePlanDetails(state, newPlanDetails) {
      state.planDetails = newPlanDetails;
    }
  },
  actions: {
    async getPlanDetails({ commit, dispatch, rootState, rootGetters }) {
      if (!rootGetters.ownerId) {
        await dispatch('getOwnerData', {
          ownerId: rootState.ownerStore.ownerIdCookie,
          userType: 'owner'
        });
      }
      const response = await axios.post(
        server + '/payment/retrieve-payment-method',
        {
          ownerId: rootGetters.ownerId
        }
      );
      commit('updatePlanDetails', response.data);
    },
    async getUsageData({ commit, state }, id) {
      try {
        const response = await axios.post(`${server}/files/get-usage`, id);
        commit('updateUsage', response.data);
      } catch (err) {
        error(new Error('%o'), err);
      }
    }
  }
};
