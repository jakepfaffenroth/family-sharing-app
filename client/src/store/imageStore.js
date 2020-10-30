export default {
  state: { images: [] },
  getters: {
    images: state => state.images,
    imageCount: state => state.images.length
  },
  mutations: {
    updateImages(state, imagesArr) {
      state.images = imagesArr;
    },
    addToImages(state, imgToAdd) {
      state.images.push(imgToAdd);
    },
    removeFromImages(state, indexToRemove) {
      let images = state.images;
      state.images.splice(indexToRemove, 1);
    }
  },
  actions: {
    nukeImages({ commit }) {
      commit('updateImages', []);
    },
    updateImages({ commit }, imagesArr) {
      commit('updateImages', imagesArr);
    },
    addToImages({ commit, rootGetters }, imgToAdd) {
      imgToAdd = { ...imgToAdd, ownerId: rootGetters.ownerId };
      commit('addToImages', imgToAdd);
    },
    removeFromImages({ commit, state }, imgToRemove) {
      const indexToRemove = state.images.findIndex(
        x => x.fileId === imgToRemove.fileId
      );
      if (indexToRemove === -1) {
        console.error('oops');
      } else {
        commit('removeFromImages', indexToRemove);
      }
    }
  }
};
