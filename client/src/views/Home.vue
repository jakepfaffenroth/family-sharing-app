<template>
  <div>
    <!-- Header and Menu -->
    <header class="fixed w-full z-40 bg-white pt-2 sm:pt-4 xl:pt-6">
      <component
        :is="userType === 'owner' ? 'HomeMenuOwner' : 'HomeMenuGuest'"
        :data-test="userType === 'owner' ? 'ownerMenu' : 'guestMenu'"
        :owner="owner"
        :is-select-mode="isSelectMode"
        class="pb-4 px-2 sm:px-6 xl:px-12"
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

    <section
      class="flex flex-grow mt-32 px-2 pb-2 sm:px-6 sm:pb-4 xl:px-12 xl:pb-6"
    >
      <!-- Skeleton gallery while loading -->
      <div
        v-if="view.imgsLoadingX"
        data-test="gallerySkeleton"
        class="relative flex flex-wrap justify-items-stretch w-full pt-2 sm:pt-4 overflow-hidden"
      >
        <div
          v-for="n in 20"
          :key="n"
          class="p-1 w-1/2 sm:w-1/3 lg:w-1/4 xl:w-1/5 2xl:w-1/6 h-48"
        >
          <base-skeleton-image class="w-full h-full"></base-skeleton-image>
        </div>
      </div>

      <!-- Image gallery -->
      <!-- :class="{ 'opacity-0': view.imgsLoading }" -->
      <div class="relative flex flex-grow w-full pt-2 sm:pt-4">
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
      </div>
    </section>

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
      v-if="visibleModal"
      data-test="homeModal"
      :img-info="imgInfo"
      :albums="albums"
      :all-images="allImages"
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
  markRaw,
  onBeforeMount,
  onMounted,
  forceUpdate
} from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
import axios from 'axios';

import HomeAlbum from '../components/HomeAlbum';
import HomeGallery from '../components/HomeGallery';
import HomeGalleryEmpty from '../components/HomeGalleryEmpty';
import BaseDropMenu from '../components/BaseDropMenu';
import BaseSkeletonImage from '../components/BaseSkeletonImage';
import HomeMenuOwner from '../components/HomeMenuOwner';
import HomeMenuImageSorter from '../components/HomeMenuImageSorter';
import ActionsBar from '../components/HomeActionsBar';
import HomeActionsBarAlbumTabs from '../components/HomeActionsBarAlbumTabs';
import HomeActionsBarSelectionTools from '../components/HomeActionsBarSelectionTools';

import HomeModalGuestSubscribe from '../components/HomeModalGuestSubscribe';
import HomeModalDeleteImage from '../components/HomeModalDeleteImage';
// import HomeUploader from '../components/HomeUploader';
const HomeUploader = defineAsyncComponent(() =>
  import('../components/HomeUploader')
);
const HomeMenuGuest = defineAsyncComponent(() =>
  import('../components/HomeMenuGuest')
);
import HomeModalShare from '../components/HomeModalShare';
import HomeModalAlbumPicker from '../components/HomeModalAlbumPicker';
import HomeModalNewAlbum from '../components/HomeModalNewAlbum';
import HomeModalDeleteAlbum from '../components/HomeModalDeleteAlbum';

import downloader from '../utils/downloadZip';

export default {
  name: 'Home',
  components: {
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
      { albumId: 0, albumName: 'All' },
      ...store.state.imageStore.albums.filter(album => {
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

    // const imgsLoading = computed(() => {
    //   let loadCount = 0;
    //   images.value.forEach(image => {
    //     const cacheImg = new Image();
    //     cacheImg.addEventListener('load', function() {
    //       loadCount++;
    //     });
    //     cacheImg.src = image.thumbnail;
    //     console.log(
    //       'loadCount, images.value.length:',
    //       loadCount,
    //       images.value.length
    //     );
    //   });
    //   return loadCount < images.value.length;
    // });
    // ---------- SETUP ---------- //
    // App functionality determined by user type
    const { userType } = reactive(props);
    sortImages('captureTime');

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
    // Preload images as soon as possible
    // let imgLoadCount = 0;
    // images.value.forEach(item => {
    //   // console.log('item:', item);
    //   const cacheImg = new Image();
    //   cacheImg.src = item.thumbnail;
    //   // cacheImg.fileName = item.fileName;
    //   // cacheImg.onload = () => (item.loaded = true);
    //   cacheImg.onload = () => imgLoadCount++;
    //   // console.log('cacheImg:', cacheImg);
    // });

    const ownerLoading = computed(() => !owner.value.ownerId);
    // const imgsLoading = computed(() => imgLoadCount === images.value.length);
    // const imgsLoading = computed(() => images.value == false);
    const view = reactive({
      atTopOfPage: true,
      ownerLoading,
      imgsLoading: true
    });

    // Update gallery after new images uplaoded
    // function updateImages(fileInfo) {
    //   const { fileId, filename, src, thumbnail, uploadTime } = fileInfo;
    //   const newImg = {
    //     fileId,
    //     fileName: filename,
    //     src,
    //     thumbnail,
    //     uploadTime,
    //     w: fileInfo.metadata.w,
    //     h: fileInfo.metadata.h,
    //     ownerId: owner.value.ownerId,
    //     exif: fileInfo.metadata.exif
    //   };
    //   images.value.unshift(newImg);
    // }
    // provide('updateImages', updateImages);

    // ---------- ACTIONS ---------- //
    const actionsBar = computed(() => {
      if (isSelectMode.value) {
        return 'SelectionTools';
      } else {
        return 'AlbumTools';
      }
    });

    const imgInfo = ref(null);
    provide('passImgInfo', info => {
      imgInfo.value = info;
    });

    // ---------- SELECTION ---------- //
    let isSelectMode = ref(false);

    function toggleSelectMode() {
      if (isSelectMode.value === true) {
        clearSelection();
      }
      isSelectMode.value = !isSelectMode.value;
    }
    provide('toggleSelectMode', toggleSelectMode);

    function selectAll() {
      const filtered = filteredImages(
        albums.value.find(x => x.albumName === activeGallery.value)
      );
      store.dispatch('replaceSelectedImages', filtered);
    }

    function clearSelection() {
      images.value.forEach(img => {
        img.isSelected = false;
      });
    }

    // ---------- SORTING ---------- //
    function sortImages(sortParameter) {
      if (sortParameter === 'reverse') {
        images.value.reverse();
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
          fileA = a.exif.exif.DateTimeOriginal || null;
          fileB = b.exif.exif.DateTimeOriginal || null;
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
        images.value.sort(compare);
      } catch (err) {
        console.error('err: ', err);
      }
    }
    provide('sortImages', sortImages);

    // ---------- GALLERIES ---------- //
    const activeGallery = ref('All');
    const setActiveGallery = galleryName => {
      activeGallery.value = galleryName;
    };
    provide('setActiveGallery', galleryName => {
      activeGallery.value = galleryName;
    });

    const imgGroups = computed(() => {
      if (!this.items) {
        return;
      }
      let group = this.items.reduce((r, a) => {
        const captureDate = a.exif.exif.DateTimeOriginal
          ? format(
              new Date(a.exif.exif.DateTimeOriginal.split('T').shift()),
              'E, LLL dd'
            )
          : null;

        const uploadDate = format(
          new Date(parseInt(a.uploadTime)),
          'E, LLL dd'
        );

        r[captureDate || uploadDate] = [
          ...(r[captureDate || uploadDate] || []),
          a
        ];
        return r;
      }, {});

      return group;
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

    // ---------- MODALS ---------- //
    const visibleModal = ref(null);

    provide('openModal', modalName => {
      visibleModal.value = modalName;
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
    const nuke = async () => {
      store.dispatch('nukeImages');

      forceUppyReloadKey.value++; //force Uppy to reload

      const response = await axios.post(`${server}/files/delete-image`, {
        nuke: true,
        ownerId: owner.value.ownerId
      });
      console.log('response:', response);
      if (response.status != 200) {
        console.error(
          `Nuking error: ${response.status} - ${response.statusText}`
        );
      }
      store.dispatch('getUsageData', { ownerId: owner.value.ownerId });
    };
    provide('nuke', nuke);

    return {
      server,
      owner,
      images,
      allImages,
      filteredImages,
      albums,
      sortImages,
      isSelectMode,
      selectAll,
      activeGallery,
      actionsBar,
      visibleModal,
      imgInfo,
      forceUppyReloadKey,
      downloadZip,
      view
    };
  }
};
</script>

<style scoped>
.album-enter-active {
  @apply transition-all duration-75 ease-out;
}

.album-leave-active {
  @apply transition-all duration-75 ease-in;
}

.album-enter-from {
  @apply transform -translate-y-10 opacity-0;
}
,
.album-leave-to {
  @apply transform translate-y-10 opacity-0;
}
</style>
