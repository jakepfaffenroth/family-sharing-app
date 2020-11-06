<template>
  <!-- <p class="text-xs">
    {{ albums }}
  </p>
  <p class="text-xs">
    {{ 'images.length: ' + images.length }}
  </p>
  <p class="text-xs">
    {{ 'allImages.length: ' + allImages.length }}
  </p>
  <p class="text-xs">
    {{ 'activeGallery: ' + activeGallery }}
  </p> -->
  <!-- Header and Menu -->
  <component
    :is="user.menuType"
    :data-test="user.type === 'owner' ? 'ownerMenu' : 'guestMenu'"
    :owner="owner"
    @open-modal="visibleModal = $event"
    @sort-images="sortImages"
    @download-zip="downloadZip"
  ></component>

  <!-- Album tab bar -->
  <div
    v-if="albums"
    data-test="albumTabBar"
    class="flex space-x-2 p-2 pb-0 border-b-2 border-purple-200 text-sm font-medium"
  >
    <!-- <button
      class="mb-1 px-8 border-2 border-white rounded transition-all duration-150 ease-in-out"
      :class="{
        'bg-teal-200 text-teal-900': activeGallery === 'All',
        'hover:bg-teal-100 hover:border-2 hover:border-teal-200':
          activeGallery !== 'All'
      }"
      @click="activeGallery = 'All'"
    >
      All
    </button> -->
    <button
      v-for="album in albums"
      :key="album"
      :data-test="'albumTab_' + album.albumName"
      class="mb-1 px-6 border-2 border-white rounded transition-all duration-150 ease-in-out"
      :class="{
        'bg-teal-200 text-teal-900 rounded': activeGallery === album.albumName,
        'hover:bg-teal-100 hover:border-2 hover:border-teal-200':
          activeGallery !== album.albumName
      }"
      @click="activeGallery = album.albumName"
    >
      {{ album.albumName }}
    </button>
  </div>
  <p>{{ 'owner.ownerId:' + owner.ownerId }}</p>
  <p>{{ 'images:' + images }}</p>
  <div
    v-if="owner.ownerId && images"
    class="relative flex flex-grow overflow-hidden"
  >
    <!-- Image gallery -->
    <transition-group appear name="album" mode="out-in">
      <!-- <div v-show="activeGallery === 'All'" class="absolute">
        <home-gallery
          :user-type="user.type"
          :items="allImages"
          @open-modal="visibleModal = $event"
          @img-delete-info="imgInfo = $event"
        ></home-gallery>
      </div> -->
      <div
        v-for="(album, index) in albums"
        v-show="activeGallery === album.albumName"
        :key="index"
        class="absolute"
      >
        <home-gallery
          :data-test="'albumGallery_' + album.albumName"
          :user-type="userType"
          :items="
            album.albumId === 0
              ? allImages
              : images.filter(x => x.albumId === album.albumId)
          "
          @open-modal="visibleModal = $event"
          @img-delete-info="imgInfo = $event"
        ></home-gallery>
      </div>
    </transition-group>

    <!-- Empty gallery  -->
    <home-gallery-empty
      v-if="images.length === 0 && user.type === 'owner' && owner"
      id="empty-gallery"
      class="uppy-select-files"
    ></home-gallery-empty>

    <!-- Uppy file uploader -->
    <!-- Don't load until owner Info is fetched -->
    <home-uploader
      v-if="user.type === 'owner' && owner"
      :key="forceReloadKey"
    ></home-uploader>

    <!-- Modals -->
    <component
      :is="visibleModal"
      v-if="visibleModal"
      data-test="homeModal"
      :img-info="imgInfo"
      @close-modal="visibleModal = null"
    ></component>
  </div>

  <!-- Skeleton while content loads -->
  <div v-else class="flex flex-wrap">
    <base-skeleton-image v-for="n in 10" :key="n"></base-skeleton-image>
  </div>

  <div id="uploader"></div>
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
  onMounted
} from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
import axios from 'axios';

import HomeAlbum from '../components/HomeAlbum';
import HomeGallery from '../components/HomeGallery';
import HomeGalleryEmpty from '../components/HomeGalleryEmpty';
import BaseSkeletonImage from '../components/BaseSkeletonImage';
import HomeMenuOwner from '../components/HomeMenuOwner';
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
// const HomeModalShare = defineAsyncComponent(() =>
//   import('../components/HomeModalShare')
// );
// const HomeModalDeleteImage = defineAsyncComponent(() =>
//   import('../components/HomeModalDeleteImage')
// );

import downloader from '../utils/downloadZip';

export default {
  name: 'Home',
  components: {
    BaseSkeletonImage,
    HomeMenuOwner,
    HomeMenuGuest,
    HomeUploader,
    HomeAlbum,
    HomeGallery,
    HomeGalleryEmpty,
    HomeModalShare,
    HomeModalGuestSubscribe,
    HomeModalDeleteImage
  },
  props: {
    // owner: { type: Object, default: null },
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
      ...store.state.imageStore.albums
    ]);

    const user = reactive({ type: null, menuType: null });

    const activeGallery = ref('All');
    const visibleModal = ref(null);

    // App functionality and menu determined by user type
    const { userType } = reactive(props);
    let isShareModalVisible = ref(false);
    onMounted(() => renderUserType(userType));

    function renderUserType(userType) {
      user.type = userType;
      user.menuType =
        userType === 'owner' ? markRaw(HomeMenuOwner) : markRaw(HomeMenuGuest);
      sortImages('captureTime');
    }

    // Prevent right clicking images
    document.addEventListener('contextmenu', event => {
      if (event.target.nodeName === 'IMG') {
        event.preventDefault();
      }
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

    // Sorting logic
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

    // Download Zip file
    const toast = inject('toast');
    function downloadZip() {
      downloader(images.value, toast);
    }

    // const isDeleteModalVisible = ref(false);
    const imgInfo = ref(null);

    // function openDeleteModal(imgInfo) {
    //   visibleModal.value = 'deleteImage';
    //   imgDeleteInfo.value = { ...imgInfo };
    // }

    // // Delete individual images
    // async function deleteImage(imgInfo) {
    //   visibleModal.value = null;
    //   const { date, fileId, thumbFileId, fileName, ownerId, index } = imgInfo;

    //   store.dispatch('removeFromImages', imgInfo);
    //   // force Uppy to reload if there are zero images
    //   if (images.value.length === 0) {
    //     forceReloadKey.value++;
    //   }
    //   const response = await axios.post(`${server}/files/delete-image`, {
    //     singleImage: true,
    //     fileId,
    //     thumbFileId,
    //     fileName,
    //     ownerId
    //   });
    //   if (response.status != 200) {
    //     console.log(
    //       `Deletion error: ${response.status} - ${response.statusText}`
    //     );
    //     store.dispatch('addToImages', imgInfo);
    //   }
    //   store.dispatch('getUsageData', { ownerId: owner.value.ownerId });
    // }

    //Delete multiple images at once (user-selected, NOT nuking)
    let forceReloadKey = ref(0); // Force reload after deleting multiple images or nuking
    const deleteMultiple = async () => {
      const imagesArr = store.state.imageStore.images;
      store.dispatch('removeMultipleImages');

      forceReloadKey.value++; //force Uppy to reload

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

    // Nuke images for dev purposes
    const nuke = async () => {
      store.dispatch('nukeImages');

      forceReloadKey.value++; //force Uppy to reload

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
      albums,
      user,
      sortImages,
      activeGallery,
      visibleModal,
      imgInfo,
      nuke,
      forceReloadKey,
      downloadZip
    };
  },
  computed: {
    imgGroups() {
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
    }
  },
  methods: {
    openSubscribeForm() {
      this.isFormVisible = true;
    }
  }
};
</script>

<style scoped>
.album-enter-active {
  @apply transition-all duration-200 ease-out;
}

.album-leave-active {
  @apply transition-all duration-150 ease-in;
}

.album-enter-from,
.album-leave-to {
  @apply transform -translate-y-10 opacity-0;
}
</style>
