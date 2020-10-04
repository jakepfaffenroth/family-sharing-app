<template>
  <div>
    <div
      v-show="isReadyToRender"
      class="flex flex-col min-h-screen w-full px-2 py-2 sm:px-6 sm:py-4
        xl:px-12 xl:py-6"
    >
      <!-- Header and Menu -->
      <div class="flex flex-col sm:flex-row sm:justify-between">
        <component
          :is="user.typeMenu"
          :owner="owner"
          :guest="guest"
          :usage="usage"
          :sub-options="subOptions"
          @sort-images="sortImages"
        ></component>
      </div>

      <!-- Image gallery -->
      <gallery
        :items="images"
        :owner="owner"
        :user-type="user.type"
        @delete-image="showDeleteModal"
      ></gallery>

      <!-- Empty gallery  -->
      <div
        v-if="images.length === 0 && user.type === 'owner' && owner.ownerId"
        id="empty-gallery"
        class="uppy-select-files flex flex-grow justify-center rounded border-4 border-dashed border-gray-400 text-gray-500 hover:bg-gray-200 hover:text-gray-600 cursor-pointer transition-all duration-200 ease-in-out"
      >
        <p class="flex-grow self-center text-center text-2xl">
          Upload some images!
        </p>
      </div>
    </div>

    <!-- Uppy file uploader -->
    <uppy
      v-if="user.type === 'owner'"
      :key="forceReloadKey"
      :owner="owner"
      @update-images="updateImages"
    ></uppy>

    <delete-modal
      v-show="isDeleteModalVisible"
      :img-delete-info="imgDeleteInfo"
      @toggle-form="isDeleteModalVisible = !isDeleteModalVisible"
      @delete-image="deleteImage"
    ></delete-modal>
  </div>
</template>

<script scoped>
import { provide, ref, reactive, defineAsyncComponent } from 'vue';

import axios from 'axios';
import { Notyf } from 'notyf';
import 'notyf/notyf.min.css';
import Toastify from 'toastify-js';

import ColorfulLogo from './components/ColorfulLogo';
import OwnerMenu from './components/OwnerMenu';
import GuestMenu from './components/GuestMenu';
import Uppy from './components/Uppy';
// import VuePictureSwipe from './components/VuePictureSwipe';
import DeleteModal from './components/DeleteModal';

// const Gallery = defineAsyncComponent(() =>
//   import('./components/VuePictureSwipe.vue')
// );

export default {
  components: {
    ColorfulLogo,
    OwnerMenu,
    GuestMenu,
    Uppy,
    Gallery: defineAsyncComponent(() =>
      import('./components/VuePictureSwipe.vue')
    ),
    DeleteModal
  },

  setup() {
    const server = process.env.VUE_APP_SERVER;
    let isReadyToRender = ref(false);
    let isDeleteModalVisible = ref(false);
    let forceReloadKey = ref(0);

    const user = reactive({ type: null, typeMenu: null });
    const owner = reactive({});
    const images = ref([]);

    const toast = new Notyf({
      position: { x: 'right', y: 'top' },
      duration: 2000,
      types: [
        {
          type: 'info'
        }
      ]
    });

    provide('images', images);
    provide('userType', user.type);
    provide('owner', owner);
    provide('toast', toast);
    // -------------------------------------
    // ------ INITIAL CONFIGURATION --------
    // ------------ & COOKIES --------------

    const ownerId = getCookie('ownerId');
    const guestId = getCookie('guestId');

    // Prevent users from viewing app without login or guestId
    if (!guestId && !ownerId) {
      window.location = server;
    }

    // Prevent right clicking images
    document.addEventListener('contextmenu', event => {
      if (event.target.nodeName === 'IMG') {
        event.preventDefault();
      }
    });

    // owner or guest id is passed as query param from server after login
    // set cookie with id and clear query from url & history
    // if there's no query param (user went to site directly) then
    // don't change the cookie
    const params = new URLSearchParams(window.location.search);
    const uId = params.get('owner');
    const gId = params.get('guest');

    if (uId) {
      document.cookie = `ownerId=${uId}`;
      window.history.replaceState(null, '', '/');
    }

    if (gId) {
      document.cookie = `guestId=${gId}`;
      window.history.replaceState(null, '', '/');
    }

    function getCookie(userType) {
      const cookieArr = document.cookie.split(';');

      // Loop through the array elements
      for (let i = 0; i < cookieArr.length; i++) {
        const cookiePair = cookieArr[i].split('=');

        // Removing whitespace at the beginning of the cookie name and compare it with the given string
        if (userType == cookiePair[0].trim()) {
          // Decode the cookie value and return
          return decodeURIComponent(cookiePair[1]);
        }
      }
    }

    // If logged in as an owner, directs to owner home.
    // If NOT logged in as owner, but has a guestId (from owner's share URL)
    // then direct to owner's guest page.
    if (ownerId) {
      renderUserType('owner');
    }
    if (guestId && !ownerId) {
      renderUserType('guest');
    }

    let usage = ref('');

    async function renderUserType(userType) {
      let response;
      console.log('userType:', userType);
      if (userType === 'owner') {
        const usageData = await axios({
          url: `${server}/files/get-usage`,
          method: 'post',
          data: { ownerId }
        });
        usage.value = usageData.data;
        console.log('usage:', usage);
        // const storageInfo = usageData.data;
        // if (storageInfo.gb >= 1)
        //   usage.value = { value: storageInfo.gb.toFixed(2), unit: 'GB' };
        // else if (storageInfo.mb >= 1)
        //   usage.value = { value: storageInfo.mb.toFixed(2), unit: 'MB' };
        // else usage.value = { value: storageInfo.kb.toFixed(2), unit: 'KB' };

        response = await axios({
          url: `${server}/auth/check-session`,
          method: 'post',
          data: { ownerId }
        });
        if (!response.data.isLoggedIn) {
          window.location = `${server}/login`;
        }
      } else {
        response = await axios({
          url: `${server}/user/get-owner`,
          method: 'post',
          data: { guestId }
        });
      }
      const ownerArr = Object.keys(response.data.owner);

      for (const key of ownerArr) {
        owner[key] = response.data.owner[key];
      }

      user.type = userType;
      user.typeMenu = userType === 'owner' ? OwnerMenu : GuestMenu;
      images.value = response.data.images.reverse();
      isReadyToRender.value = true;
      sortImages('captureTime');
    }

    // ------ IMAGE HANDLING --------
    const nuke = () => {
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

    const updateImages = fileInfo => {
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
    };
    provide('updateImages', updateImages);

    const sortImages = sortParameter => {
      if (sortParameter === 'reverse') {
        images.value.reverse();
        return;
      }

      const compare = (a, b) => {
        let fileA;
        let fileB;

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
    };
    provide('sortImages', sortImages);

    let imgDeleteInfo = ref(null);

    const showDeleteModal = imgInfo => {
      imgDeleteInfo.value = { ...imgInfo };
      isDeleteModalVisible.value = true;
    };

    const deleteImage = async imgInfo => {
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
      console.log('forceReloadKey:', forceReloadKey.value);
      axios.post(`${server}/files/delete-image`, { fileId, fileName, ownerId });
    };

    return {
      user,
      owner,
      images,
      isReadyToRender,
      isDeleteModalVisible,
      forceReloadKey,
      server,
      nuke,
      updateImages,
      sortImages,
      showDeleteModal,
      imgDeleteInfo,
      deleteImage,
      usage
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
.notyf__toast {
  @apply flex justify-between content-center w-56 h-auto p-0 text-sm font-light bg-gradient-to-r from-teal-400 to-purple-500 rounded-md;
}

.notyf__wrapper {
  @apply m-3 p-0 w-full;
}

.notyf__message {
  @apply w-full;
}

.notyf__dismiss-btn {
  @apply absolute -top-6 right-0 bg-transparent hover:bg-transparent;
}

.link {
  @apply px-3  cursor-pointer;
}

.image-grid {
  @apply mt-4;
}

.image {
  @apply flex h-10 object-contain transition duration-200 ease-in-out;
  /* flex: auto;
  height: 250px;
  min-width: 100px;
  object-fit: contain;
  transition: 0.2s ease-in-out; */
}

.image-overlay {
  @apply absolute top-0 left-0 w-full h-full opacity-0;
  /* position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0; */
}
.delete-btn {
  @apply absolute top-2 right-2 px-2 py-1 text-xs;
  /* position: absolute;
  top: 10px;
  right: 10px; */
}

.text-input {
  @apply appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:border-blue-300  sm:text-sm sm:leading-5;
}
</style>
