<template>
  <div>
    <div v-if="isReadyToRender">
      <component
        :is="user.typeMenu"
        :owner="owner"
        :guest="guest"
        :sub-options="subOptions"
      />
      <div v-if="user.type === 'owner'">
        <uppy :owner="owner" @update-images="updateImages" />
      </div>

      <p>Image count: {{ images.length }}</p>

      <image-sorter @sort-images="sortImages" />
      <vue-picture-swipe
        :items="images"
        :owner="owner"
        :user-type="user.type"
        @delete-image="deleteImage"
      />

      <div v-if="images.length === 0 && user.type === 'owner' && owner.ownerId">
        <p>Upload some images!</p>
      </div>
    </div>
    <div />
  </div>
</template>

<script scoped>
import axios from 'axios';

import { provide, ref, reactive } from 'vue';
import OwnerMenu from './components/OwnerMenu';
import GuestMenu from './components/GuestMenu';
import Uppy from './components/Uppy';
import VuePictureSwipe from './components/VuePictureSwipe';
import ImageSorter from './components/ImageSorter';

export default {
  components: {
    OwnerMenu,
    GuestMenu,
    Uppy,
    VuePictureSwipe,
    ImageSorter,
  },
  setup() {
    const server = process.env.VUE_APP_SERVER;
    const isReadyToRender = ref(false);

    const user = reactive({ type: null, typeMenu: null });
    const owner = reactive({});
    const images = ref([]);

    provide('images', images);
    provide('userType', user.type);
    provide('owner', owner);

    // -------------------------------------
    // ------ INITIAL CONFIGURATION --------
    // ------------ & COOKIES --------------

    const ownerId = getCookie('ownerId');
    const guestId = getCookie('guestId');

    // Prevent users from viewing app without login or guestId
    if (!guestId && !ownerId) {
      window.location = this.server;
    }

    // Prevent right clicking images
    document.addEventListener('contextmenu', (event) => {
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

    async function renderUserType(userType) {
      let response;
      if (userType === 'owner') {
        response = await axios({
          url: `${server}/auth/check-session`,
          method: 'post',
          data: { ownerId },
        });
        if (!response.data.isLoggedIn) {
          window.location = `${server}/login`;
        }
      } else {
        response = await axios({
          url: `${server}/user/get-owner`,
          method: 'post',
          data: { guestId },
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
      sortImages('uploadTime');
    }

    // ------ IMAGE HANDLING --------
    const nuke = () => {
      const imagesArr = images.value;
      images.value = [];

      axios.post(`${server}/files/delete-image`, {
        images: imagesArr.map((x) => {
          const { fileId, fileName } = x;
          return { fileId, fileName };
        }),
        ownerId: owner.ownerId,
      });
    };
    provide('nuke', nuke);

    const updateImages = (fileInfo) => {
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
        exif: fileInfo.metadata.exif,
      };
      images.value.unshift(newImg);
    };
    provide('updateImages', updateImages);

    const sortImages = (sortParameter) => {
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

    const deleteImage = async (
      fileId,
      smallFileId,
      fileName,
      ownerId,
      index
    ) => {
      images.value.splice(index, 1);
      axios.post(`${server}/files/delete-image`, { fileId, fileName, ownerId });
    };

    return {
      user,
      owner,
      images,
      isReadyToRender,
      server,
      nuke,
      updateImages,
      sortImages,
      deleteImage,
    };
  },
};
</script>

<style scoped>
.link {
  border: none;
  background: none;
  cursor: pointer;
}
.link:hover {
  color: blue;
}

.image-grid {
  margin-top: 1rem;
}

.image-container {
  position: relative;
  margin: 0.25rem;
  overflow: hidden;
  height: 250px;
}

.image {
  flex: auto;
  height: 250px;
  min-width: 100px;
  object-fit: contain;
  transition: 0.2s ease-in-out;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
}

.image-container:hover .image {
  scale: 1.1;
  object-fit: cover;
}

.image-container:hover .image-overlay {
  opacity: 1;
  transition: all 0.2s ease-in-out;
}
.delete-btn {
  position: absolute;
  top: 10px;
  right: 10px;
}

.share-modal {
  position: absolute;
  z-index: 1000;
  padding: 200px;
  margin: auto;
  background-color: white;
  border: 1px solid black;
}
</style>
