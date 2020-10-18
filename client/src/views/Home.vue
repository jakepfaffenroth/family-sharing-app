<template>
  <!-- Header and Menu -->
  <component
    :is="user.menuType"
    :owner="owner"
    :usage="usage"
    @sort-images="sortImages"
    @open-share-modal="isShareModalVisible = true"
    @download-zip="downloadZip"
  ></component>

  <div v-if="owner.ownerId">
    <!-- Image gallery -->
    <home-gallery
      :items="images"
      :owner="owner"
      :user-type="user.type"
      @delete-image="showDeleteModal"
    ></home-gallery>

    <!-- Empty gallery  -->
    <home-gallery-empty
      v-show="images.length === 0 && user.type === 'owner' && owner.ownerId"
      id="empty-gallery"
      class="uppy-select-files"
    ></home-gallery-empty>

    <!-- Uppy file uploader -->
    <!-- Don't load until owner Info is fetched -->
    <home-uploader
      v-if="user.type === 'owner' && owner.ownerId"
      :key="forceReloadKey"
      :owner="owner"
      @update-images="updateImages"
    ></home-uploader>

    <home-modal-share
      v-show="isShareModalVisible"
      :share-url="`${server}/${owner.guestId}/guest`"
      @close-share-modal="isShareModalVisible = !isShareModalVisible"
    />

    <home-modal-delete-image
      v-show="isDeleteModalVisible"
      :img-delete-info="imgDeleteInfo"
      @close-delete-modal="isDeleteModalVisible = !isDeleteModalVisible"
      @delete-image="deleteImage"
    ></home-modal-delete-image>
  </div>

  <!-- Skeleton while content loads -->
  <div v-else class="flex flex-wrap">
    <base-skeleton-image v-for="n in 10" :key="n"></base-skeleton-image>
  </div>
  <!-- <router-view></router-view> -->

  <!-- <home-download-zip ref="zip" :images="images" class="hidden" /> -->
</template>

<script>
import {
  provide,
  ref,
  reactive,
  inject,
  defineAsyncComponent,
  onMounted,
  toRefs,
  isReactive,
  markRaw
} from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';

import BaseColorfulLogo from '../components/BaseColorfulLogo';
// import HomeUploader from '../components/HomeUploader';
import HomeGallery from '../components/HomeGallery';
import HomeGalleryEmpty from '../components/HomeGalleryEmpty';
import BaseSkeletonImage from '../components/BaseSkeletonImage';
import HomeMenuOwner from '../components/HomeMenuOwner';
// import HomeMenuGuest from '../components/HomeMenuGuest';
// import HomeModalDeleteImage from '../components/HomeModalDeleteImage';
// const HomeGallery = defineAsyncComponent(() =>
//   import('../components/HomeGallery')
// );
const HomeUploader = defineAsyncComponent(() =>
  import('../components/HomeUploader')
);
const HomeMenuGuest = defineAsyncComponent(() =>
  import('../components/HomeMenuGuest')
);
const HomeModalShare = defineAsyncComponent(() =>
  import('../components/HomeModalShare')
);
// const HomeDownloadZip = defineAsyncComponent(() =>
//   import('../components/HomeDownloadZip')
// );
const HomeModalDeleteImage = defineAsyncComponent(() =>
  import('../components/HomeModalDeleteImage')
);

import downloader from '../utils/downloadZip';

export default {
  name: 'Home',
  components: {
    BaseColorfulLogo,
    BaseSkeletonImage,
    HomeMenuOwner,
    HomeMenuGuest,
    HomeUploader,
    HomeGallery,
    HomeGalleryEmpty,
    HomeModalShare,
    HomeModalDeleteImage
    // HomeDownloadZip
    // downloadZip
  },
  props: {
    owner: {
      type: Object,
      default: null
    },
    images: {
      type: Array,
      default: () => {
        return [];
      }
    },
    usage: {
      type: Object,
      default: null
    }
  },
  setup(props) {
    const route = useRoute();
    const server = process.env.VUE_APP_SERVER;
    const { owner, images, usage } = toRefs(props);
    const user = reactive({ type: null, menuType: null });

    // App functionality and menu determined by user type
    const userType = inject('userType');
    let isShareModalVisible = ref(false);
    renderUserType(userType);

    async function renderUserType(userType) {
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
    function updateImages(fileInfo) {
      const { fileId, filename, src, thumbnail, uploadTime } = fileInfo;
      const newImg = {
        fileId,
        fileName: filename,
        src,
        thumbnail,
        uploadTime,
        w: fileInfo.metadata.w,
        h: fileInfo.metadata.h,
        ownerId: owner.ownerId,
        exif: fileInfo.metadata.exif
      };
      images.value.unshift(newImg);
    }
    provide('updateImages', updateImages);

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
        console.log('err: ', err);
      }
    }
    provide('sortImages', sortImages);

    // Download Zip file
    const toast = inject('toast');
    function downloadZip() {
      downloader(images.value, toast);
    }

    // Delete individual images
    let isDeleteModalVisible = ref(false);
    let imgDeleteInfo = ref(null);

    function showDeleteModal(imgInfo) {
      imgDeleteInfo.value = { ...imgInfo };
      isDeleteModalVisible.value = true;
    }

    async function deleteImage(imgInfo) {
      isDeleteModalVisible = false;
      const { date, fileId, smallFileId, fileName, ownerId, index } = imgInfo;

      images.value.splice(
        images.value.indexOf(images.value.find(x => x.fileId === fileId)),
        1
      );

      // force Uppy to reload if there are zero images
      if (images.value.length === 0) {
        forceReloadKey.value++;
      }
      axios.post(`${server}/files/delete-image`, { fileId, fileName, ownerId });
    }

    // Nuke images for dev purposes
    let forceReloadKey = ref(0); // Force reload after nuking
    const nuke = () => {
      console.log('owner.ownerId:', owner.ownerId);
      const imagesArr = images.value;
      images.value = [];

      forceReloadKey.value++; //force Uppy to reload

      axios.post(`${server}/files/delete-image`, {
        images: imagesArr.map(x => {
          const { fileId, fileName } = x;
          return { fileId, fileName };
        }),
        ownerId: owner.ownerId
      });
    };
    provide('nuke', nuke);

    return {
      server,
      user,
      updateImages,
      sortImages,
      isShareModalVisible,
      isDeleteModalVisible,
      showDeleteModal,
      imgDeleteInfo,
      deleteImage,
      nuke,
      forceReloadKey,
      downloadZip
    };
  },
  computed: {
    imgGroups() {
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
  }
};
</script>

<style>
.link {
  @apply px-3  cursor-pointer;
}

.image-grid {
  @apply mt-4;
}

.image {
  @apply flex h-10 object-contain transition duration-200 ease-in-out;
}

.image-overlay {
  @apply absolute top-0 left-0 w-full h-full opacity-0;
}

.text-input {
  @apply appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:border-blue-300  sm:text-sm sm:leading-5;
}
</style>
