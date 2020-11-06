export default {
  state: { images: [], albums: [] },
  getters: {
    images: state => state.images,
    albums: state => state.albums,
    imageCount: (state, getters) => getters.allImages.length,
    allImages: state =>
      state.images.filter(
        (current, index, array) =>
          array.findIndex(x => x.fileId === current.fileId) === index
      )
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
    },
    updateAlbums(state, albumArr) {
      state.albums = albumArr;
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
    },
    updateAlbums({ commit, state }, albumArr) {
      commit('updateAlbums', albumArr);
    }
  }
};
