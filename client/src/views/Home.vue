<template>
  <div class="flex flex-col flex-grow">
    <!-- Header and Menu -->
    <!-- <div class="h-auto relative"> -->
    <header class="fixed w-full z-40 bg-white pt-2 xl:pt-4">
      <component
        :is="userType === 'owner' ? 'HomeMenuOwner' : 'HomeMenuGuest'"
        :data-test="userType === 'owner' ? 'ownerMenu' : 'guestMenu'"
        :owner="owner"
        :is-select-mode="isSelectMode"
        class="sm:pb-4 px-2 sm:px-3 md:px-6 xl:px-8"
        @open-modal="visibleModal = $event"
        @sort-images="sortImages"
        @download-zip="downloadZip"
      ></component>

      <!-- Action bar -->
      <actions-bar
        :actions-bar="actionsBar"
        :is-select-mode="isSelectMode"
        :view="view"
        :active-gallery="activeGallery"
        :filtered-images="filteredImages"
        :user-type="userType"
        @set-active-gallery="activeGallery = $event"
      ></actions-bar>
    </header>
    <!-- </div> -->

    <main
      class="flex flex-grow mt-28 md:pt-6 py-2 px-1 sm:px-3 sm:py-4 md:px-4 lg:px-6 xl:pt-8 xl:px-8 xl:pb-6"
    >
      <loading-text v-if="view.ownerLoading" />
      <!-- Image gallery -->
      <transition appear name="album" mode="out-in">
        <home-gallery
          v-if="view.ownerLoading || filteredImages.length"
          :key="activeGallery"
          :data-test="'albumGallery-' + activeGallery"
          :user-type="userType"
          :items="filteredImages"
          :is-select-mode="isSelectMode"
          :view="view"
          @imgs-loaded="view.imgsLoading = false"
        ></home-gallery>

        <home-gallery-empty
          v-else
          :key="activeGallery"
          data-test="empty-album"
          :active-gallery="activeGallery"
          @reload-uppy="forceUppyReloadKey++"
        >
          <template #emptyGalleryText>
            {{
              activeGallery === 'All' ? 'Upload some images!' : 'Empty Album'
            }}
          </template>
        </home-gallery-empty>
      </transition>
    </main>

    <!-- Uppy file uploader -->
    <!-- Don't load until owner Info is fetched -->
    <home-uploader
      v-if="userType === 'owner' && owner"
      :key="forceUppyReloadKey"
      :active-gallery="activeGallery"
    ></home-uploader>
    <div id="uploader"></div>

    <!-- Modals -->
    <component
      :is="visibleModal"
      v-show="visibleModal"
      data-test="homeModal"
      :active-gallery="activeGallery"
      :img-info="imgInfo"
      :albums="albums"
      :all-images="allImages"
      :modal-switch="modalSwitch"
      @close-modal="visibleModal = null"
    ></component>
  </div>
</template>

<script>
import {
  ref,
  reactive,
  computed,
  provide,
  inject,
  defineAsyncComponent,
  onBeforeMount
} from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
import axios from 'axios';

import HomeAlbum from '../components/HomeAlbum';
import HomeGallery from '../components/HomeGallery';
import HomeGalleryEmpty from '../components/HomeGalleryEmpty';
import LoadingText from '../components/BaseLoadingText';
import BaseDropMenu from '../components/BaseDropMenu';
import BaseSkeletonImage from '../components/BaseSkeletonImage';
import HomeMenuOwner from '../components/HomeMenuOwner';
import HomeMenuImageSorter from '../components/HomeMenuImageSorter';
import ActionsBar from '../components/HomeActionsBar';
import HomeActionsBarAlbumTabs from '../components/HomeActionsBarAlbumTabs';
import HomeActionsBarSelectionTools from '../components/HomeActionsBarSelectionTools';

import HomeModalGuestSubscribe from '../components/HomeModalGuestSubscribe';
import HomeModalDeleteImage from '../components/HomeModalDeleteImage';
const HomeUploader = defineAsyncComponent(() =>
  import('../components/HomeUploader')
);
const HomeMenuGuest = defineAsyncComponent(() =>
  import('../components/HomeMenuGuest')
);
import HomeModalShare from '../components/HomeModalShare';
// import HomeModalImageShare from '../components/HomeModalImageShare';
import HomeModalAlbumPicker from '../components/HomeModalAlbumPicker';
import HomeModalNewAlbum from '../components/HomeModalNewAlbum';
import HomeModalDeleteAlbum from '../components/HomeModalDeleteAlbum';

import downloader from '../utils/downloadZip';

export default {
  name: 'Home',
  components: {
    LoadingText,
    BaseDropMenu,
    BaseSkeletonImage,
    HomeMenuOwner,
    HomeMenuGuest,
    HomeMenuImageSorter,
    HomeUploader,
    HomeAlbum,
    HomeGallery,
    HomeGalleryEmpty,
    ActionsBar,
    HomeActionsBarAlbumTabs,
    HomeActionsBarSelectionTools,
    HomeModalShare,
    // HomeModalImageShare,
    HomeModalAlbumPicker,
    HomeModalNewAlbum,
    HomeModalDeleteAlbum,
    HomeModalGuestSubscribe,
    HomeModalDeleteImage
  },
  props: {
    userType: { type: String, default: '' }
  },
  setup(props) {
    const store = useStore();
    const route = useRoute();
    const server = process.env.VUE_APP_SERVER;

    const owner = computed(() => store.state.ownerStore.owner);
    const images = computed(() => store.state.imageStore.images);
    const allImages = computed(() => store.getters.allImages);
    const albums = computed(() => [
      // Hide empty albums from guests
      ...store.getters.albums.filter(album => {
        if (props.userType === 'owner') {
          return true;
        } else if (
          props.userType === 'guest' &&
          images.value.filter(img => img.albumId === album.albumId).length
        ) {
          return true;
        } else {
          return false;
        }
      })
    ]);

    // ---------- SETUP ---------- //
    // Prevent right clicking images
    document.addEventListener('contextmenu', event => {
      if (event.target.nodeName === 'IMG') {
        event.preventDefault();
      }
    });

    // Header shadow effect on scroll
    onBeforeMount(() => window.addEventListener('scroll', handlePageScroll));
    function handlePageScroll() {
      // when the user scrolls, check the pageYOffset
      if (window.pageYOffset > 0) {
        // user is scrolled
        if (view.atTopOfPage) view.atTopOfPage = false;
      } else {
        // user is at top of page
        if (!view.atTopOfPage) view.atTopOfPage = true;
      }
    }

    // ---------- VIEW ---------- //
    const ownerLoading = computed(() => !owner.value.ownerId);
    const view = reactive({
      atTopOfPage: true,
      ownerLoading,
      imgsLoading: true
    });

    // ---------- GALLERIES ---------- //
    const activeGallery = ref('All');
    provide('setActiveGallery', galleryName => {
      activeGallery.value = galleryName;
      store.dispatch('replaceSelectedImages', []);
    });

    const filteredImages = computed(() => {
      if (activeGallery.value === 'All') {
        return allImages.value;
      } else {
        const albumId = albums.value.find(
          x => x.albumName === activeGallery.value
        ).albumId;

        return images.value.filter(x => x.albumId === albumId);
      }
    });

    // ---------- ACTIONS ---------- //
    const actionsBar = computed(() => {
      if (isSelectMode.value) {
        return 'SelectionTools';
      } else {
        return 'AlbumTools';
      }
    });

    const imgInfo = ref({});

    // ---------- SELECTION ---------- //
    let isSelectMode = ref(false);
    provide('toggleSelectMode', () => {
      if (isSelectMode.value === true) {
        clearSelection();
      }
      isSelectMode.value = !isSelectMode.value;
    });

    function selectAll() {
      const filtered = filteredImages(
        albums.value.find(x => x.albumName === activeGallery.value)
      );
      store.dispatch('replaceSelectedImages', filtered);
    }

    function clearSelection() {
      store.dispatch('replaceSelectedImages', []);
      // images.value.forEach(img => {
      //   img.isSelected = false;
      // });
    }

    // ---------- SORTING ---------- //
    function sortImages(sortParameter) {
      if (sortParameter === 'reverse') {
        filteredImages.value.reverse();
        return;
      }

      const compare = (a, b) => {
        let fileA;
        let fileB;

        // If no image exif, add it as empty string
        a.exif = a.exif || { ...a.exif, exif: '' };
        b.exif = b.exif || { ...a.exif, exif: '' };
        a.exif.exif = a.exif.exif || '';
        b.exif.exif = b.exif.exif || '';

        if (sortParameter === 'captureTime') {
          fileA = a.captureTime || a.uploadTime;
          fileB = b.captureTime || b.uploadTime;
        }
        if (sortParameter === 'uploadTime') {
          fileA = a.uploadTime;
          fileB = b.uploadTime;
        }
        let comparison = 0;
        if (fileA > fileB) {
          comparison = -1;
        } else if (fileA < fileB) {
          comparison = 1;
        }
        return comparison;
      };
      try {
        filteredImages.value.sort(compare);
      } catch (err) {
        console.error('err: ', err);
      }
    }
    provide('sortImages', sortImages);

    // ---------- MODALS ---------- //
    const visibleModal = ref(null);
    const modalSwitch = ref(null);

    provide('openModal', (modalName, payload) => {
      payload = payload || {};

      imgInfo.value = payload.imgInfo;
      modalSwitch.value = payload.modalSwitch;
      visibleModal.value = modalName;
      console.log('visibleModal.value:', visibleModal.value);
    });
    provide('closeModal', () => (visibleModal.value = null));
    provide('openUploader', () => true);

    // ---------- DOWNLOADING ---------- //
    const toast = inject('toast');
    function downloadZip() {
      downloader(images.value, toast);
    }

    // ---------- DELETION ---------- //
    // Delete multiple images at once (user-selected, NOT nuking)
    let forceUppyReloadKey = ref(0); // Force reload after deleting multiple images or nuking
    const deleteMultiple = async () => {
      const imagesArr = store.state.imageStore.images;
      store.dispatch('removeMultipleImages');

      forceUppyReloadKey.value++; //force Uppy to reload

      const response = await axios.post(`${server}/files/delete-image`, {
        multipleImages: true,
        images: imagesArr.map(x => {
          const { fileId, thumbFileId, fileName, ownerId } = x;
          return { fileId, thumbFileId, fileName, ownerId };
        }),
        ownerId: owner.value.ownerId
      });
      if (response.status != 200) {
        console.error(
          `Deletion error: ${response.status} - ${response.statusText}`
        );
      }
      store.dispatch('getUsageData', { ownerId: owner.value.ownerId });
    };

    // Nuke images for dev purposes OR ACCOUNT DELETION
    const NUKE = async () => {
      store.dispatch('NUKE'); // Remove all images & albums from store

      forceUppyReloadKey.value++; //force Uppy to reload

      const response = await axios.post(`${server}/files/delete-image`, {
        NUKE: true,
        ownerId: owner.value.ownerId
      });

      if (response.status != 200) {
        console.error(
          `Nuking error: ${response.status} - ${response.statusText}`
        );
      }
      store.dispatch('getUsageData', { ownerId: owner.value.ownerId });
    };
    provide('NUKE', NUKE);

    return {
      owner,
      allImages,
      filteredImages,
      albums,
      sortImages,
      isSelectMode,
      activeGallery,
      actionsBar,
      visibleModal,
      modalSwitch,
      imgInfo,
      forceUppyReloadKey,
      downloadZip,
      view
    };
  }
};
</script>

<style></style>
