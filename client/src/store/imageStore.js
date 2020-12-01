const server = process.env.VUE_APP_SERVER;
import axios from 'axios';

export default {
  state: { images: [], albums: [], selectedImages: [] },
  getters: {
    images: state => state.images,
    albums: state =>
      state.albums.map(album => ({
        ...album,
        images: state.images.filter(x => x.albumId === album.albumId),
      })),
    selectedImages: state => state.selectedImages,
    imageCount: (state, getters) => getters.allImages.length,
    allImages: state => {
      // console.log('state.images:', state.images);
      // const uniqueImgs = [...new Set(state.images.map(img => img.fileId))];
      // console.log('uniqueImgs:', uniqueImgs);
      // return state.images.filter(x => uniqueImgs.indexOf(x.fileId));
      return state.images.filter(
        (current, index) =>
          state.images.findIndex(x => {
            return x.fileId === current.fileId;
          }) === index
      );
    }
  },
  mutations: {
    updateImages(state, imagesArr) {
      state.images = imagesArr;
    },
    addToImages(state, imgToAdd) {
      state.images.push(imgToAdd);
    },
    // removeFromImages(state, indexToRemove) {
    //   const removedImage = state.images.splice(indexToRemove, 1);
    //   console.log('removedImage:', removedImage);
    // },
    updateAlbums(state, albumArr) {
      state.albums = albumArr;
    },
    addNewAlbum(state, newAlbum) {
      state.albums.push(newAlbum);
    },
    removeAlbum(state, albumToRemove) {
      const index = state.albums.findIndex(
        x => x.albumId === albumToRemove.albumId
      );
      state.albums.splice(index, 1);
    },
    addToSelectedImages(state, img) {
      state.selectedImages.push(img);
    },
    removeFromSelectedImages(state, img) {
      const index = state.selectedImages.findIndex(
        x => x.fileId === img.fileId
      );
      state.selectedImages.splice(index, 1);
    },
    replaceSelectedImages(state, selectedImages) {
      state.selectedImages = [...selectedImages];
    }
  },
  actions: {
    async fetchImages({ commit }, ids) {
      const response = await axios.post(server + '/files/fetch-images', ids);
      commit('updateImages', response.data);
    },
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
    // // ! FIX removeFromImages
    // removeFromImages({ commit, state }, imgToRemove) {
    //   const allVersionsToRemove = state.images.filter(
    //     x => x.fileId == imgToRemove.fileId
    //   );

    //   allVersionsToRemove.forEach(version => {
    //     console.log('version:', version);
    //     console.log(
    //       'found:',
    //       state.images.find(x => x.fileId == version.fileId)
    //     );
    //     const index = state.images.findIndex(x => x.fileId == version.fileId);
    //     console.log('index 1:', index);
    //     console.log('index !== -1:', index !== -1);
    //     if (index !== undefined && index !== -1) {
    //       console.log('index 2:', index);
    //       commit('removeFromImages', index);
    //     }
    //   });
    // },
    updateAlbums({ commit, state }, albumArr) {
      commit('updateAlbums', albumArr);
    },
    addNewAlbum({ commit }, newAlbum) {
      commit('addNewAlbum', newAlbum);
    },
    removeAlbum({ commit }, albumToRemove) {
      commit('removeAlbum', albumToRemove);
    },
    addToSelectedImages({ commit }, img) {
      commit('addToSelectedImages', img);
    },
    removeFromSelectedImages({ commit }, img) {
      commit('removeFromSelectedImages', img);
    },
    replaceSelectedImages({ commit }, selectedImages) {
      commit('replaceSelectedImages', selectedImages);
    }
  }
};
