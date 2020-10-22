<template>
  <!-- Header and Menu -->
  <component
    :is="user.menuType"
    @open-modal="visibleModal = $event"
    @sort-images="sortImages"
    @open-share-modal="isShareModalVisible = true"
    @open-subscribe-form="isSubscribeModalVisible = true"
    @download-zip="downloadZip"
  ></component>

  <div v-if="owner.ownerId" class="flex flex-grow">
    <!-- Image gallery -->
    <home-gallery
      :user-type="user.type"
      @open-delete-modal="openDeleteModal"
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
    ></home-uploader>

    <home-modal-share
      v-show="visibleModal === 'ownerShare'"
      :share-url="`${server}/${owner.guestId}/guest`"
      @close-modal="visibleModal = null"
    />

    <home-modal-guest-subscribe
      v-show="visibleModal === 'guestSubscribe'"
      :owner="owner"
      @close-modal="visibleModal = null"
    ></home-modal-guest-subscribe>

    <home-modal-delete-image
      v-show="visibleModal === 'deleteImage'"
      :img-delete-info="imgDeleteInfo"
      @close-modal="visibleModal = null"
      @delete-image="deleteImage"
    ></home-modal-delete-image>
  </div>

  <!-- Skeleton while content loads -->
  <div v-else class="flex flex-wrap">
    <base-skeleton-image v-for="n in 10" :key="n"></base-skeleton-image>
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
  markRaw
} from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
import axios from 'axios';

import BaseColorfulLogo from '../components/BaseColorfulLogo';
import HomeGallery from '../components/HomeGallery';
import HomeGalleryEmpty from '../components/HomeGalleryEmpty';
import BaseSkeletonImage from '../components/BaseSkeletonImage';
import HomeMenuOwner from '../components/HomeMenuOwner';
import HomeModalGuestSubscribe from '../components/HomeModalGuestSubscribe';

const HomeUploader = defineAsyncComponent(() =>
  import('../components/HomeUploader')
);
const HomeMenuGuest = defineAsyncComponent(() =>
  import('../components/HomeMenuGuest')
);
const HomeModalShare = defineAsyncComponent(() =>
  import('../components/HomeModalShare')
);
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
    HomeModalGuestSubscribe,
    HomeModalDeleteImage
  },
  props: { userType: { type: String, default: '' } },
  setup(props) {
    const store = useStore();
    const route = useRoute();
    const server = process.env.VUE_APP_SERVER;

    const owner = computed(() => store.state.ownerStore.owner);
    const images = computed(() => store.state.imageStore.images);

    const user = reactive({ type: null, menuType: null });

    const visibleModal = ref(null);

    // App functionality and menu determined by user type
    const { userType } = reactive(props);
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

    // Delete individual images
    let isDeleteModalVisible = ref(false);
    let imgDeleteInfo = ref(null);

    function openDeleteModal(imgInfo) {
      visibleModal.value = 'deleteImage';
      imgDeleteInfo.value = { ...imgInfo };
    }

    async function deleteImage(imgInfo) {
      visibleModal.value = null;
      const { date, fileId, thumbFileId, fileName, ownerId, index } = imgInfo;

      store.dispatch('removeFromImages', imgInfo);
      // force Uppy to reload if there are zero images
      if (images.value.length === 0) {
        forceReloadKey.value++;
      }
      const response = await axios.post(`${server}/files/delete-image`, {
        singleImage: true,
        fileId,
        thumbFileId,
        fileName,
        ownerId
      });
      if (response.status != 200) {
        console.log(
          `Deletion error: ${response.status} - ${response.statusText}`
        );
        store.dispatch('addToImages', imgInfo);
      }
      store.dispatch('getUsageData', { ownerId: owner.value.ownerId });
    }

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
      user,
      sortImages,
      visibleModal,
      isSubscribeModalVisible: false,
      isShareModalVisible,
      isDeleteModalVisible,
      openDeleteModal,
      imgDeleteInfo,
      deleteImage,
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
