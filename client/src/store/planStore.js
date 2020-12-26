const server = process.env.VUE_APP_SERVER;
import axios from 'axios';
import getCookie from '../utils/getCookie';

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
        return { num: Number(state.usage.gb.toFixed(2)), unit: 'GB' };
      else if (state.usage.mb >= 1)
        return { num: Number(state.usage.mb.toFixed(2)), unit: 'MB' };
      else if (state.usage.mb >= 0) {
        return { num: Number(state.usage.kb.toFixed(2)), unit: 'KB' };
      } else return { num: '', unit: 'error' };
    },
    usageBarWidth: (state, getters) => {
      if (getters.storagePercentage <= 0) return 'width: 0%';
      return getters.storagePercentage > 2
        ? 'width: ' + getters.storagePercentage + '%'
        : 'width: 2%';
    },
    usageBarColor: (state, getters) => {
      if (getters.storagePercentage < 40) {
        return 'green';
      } else if (getters.storagePercentage < 90) {
        return 'orange';
      } else {
        return 'red';
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
      const { data, status } = await axios.post(
        server + '/payment/retrieve-payment-method',
        {
          ownerId: rootGetters.ownerId || getCookie('ownerId')
        }
      );
      if (status < 200 || status >= 300) {
        console.error(new Error(data));
        return;
      }
      commit('updatePlanDetails', data);
    },
    async getUsageData({ commit, state }, id) {
      try {
        const response = await axios.post(`${server}/files/get-usage`, id);
        commit('updateUsage', response.data);
      } catch (err) {
        console.error(new Error(err));
      }
    }
  }
};
