<template>
  <div
    v-if="owner.ownerId"
    class="flex flex-col min-h-screen w-full px-2 py-2 sm:px-6 sm:py-4 xl:px-12 xl:py-6"
  >
    <!-- <component
    :is="view"
    :owner="owner"
    :images="images"
    :usage="usage"
  ></component> -->
    <!-- <div v-if="owner.ownerId"> -->
    <router-view :owner="owner" :images="images" :usage="usage"></router-view>
    <!-- </div> -->
    <!-- <div v-else class="fixed m-auto">
    <svg
      class="animate-spin mx-auto h-24 w-24 text-purple-500"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      ></circle>
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  </div> -->

    <!-- <router-view v-slot="{ Component }">
    <transition name="slide" mode="out-in">
      <keep-alive>
        <component
          :is="Component"
          :owner="owner"
          :images="images"
          :usage="usage"
        />
      </keep-alive>
    </transition>
  </router-view> -->
  </div>
</template>

<script>
import axios from 'axios';
import { ref, reactive, provide } from 'vue';
import { Notyf } from 'notyf';
import 'notyf/notyf.min.css';
import { useRoute } from 'vue-router';

import Home from './views/Home';
import Account from './views/Account';

export default {
  // components: { Home },
  setup() {
    const route = useRoute();
    const server = process.env.VUE_APP_SERVER;
    const isReadyToRender = ref(false);

    const owner = reactive({});
    const usage = ref('');
    const images = ref([]);

    provide('owner', owner);
    provide('images', images.value);

    // -------------------------------------
    // ------ INITIAL CONFIGURATION --------
    // ------------ & COOKIES --------------
    // -------------------------------------

    const ownerId = getCookie('ownerId');
    const guestId = getCookie('guestId');

    if (ownerId) {
      provide('userType', 'owner');
      getOwnerData('owner');
    }
    if (guestId && !ownerId) {
      provide('userType', 'guest');
      getOwnerData('guest');
    }
    // Prevent users from viewing app without login or guestId
    if (!guestId && !ownerId) {
      window.location = server;
    }

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

    async function getOwnerData(userType) {
      let response = {};
      let url = '';
      let id = {};
      switch (userType) {
        case 'owner':
          url = `${server}/auth/check-session`;
          id = { ownerId };
          break;
        case 'guest':
          url = `${server}/user/get-owner`;
          id = { guestId };
          break;
      }

      if (userType === 'owner') {
        const usageData = await axios({
          url: `${server}/files/get-usage`,
          method: 'post',
          data: { ownerId }
        });
        usage.value = usageData.data;
      }

      response = await axios({
        url: url,
        method: 'post',
        data: id
      });

      if (userType === 'owner' && !response.data.isLoggedIn) {
        window.location = `${server}/login`;
      }
      images.value = response.data.images;

      // Response data contains all the owner data as key-value pairs
      const ownerDataArr = Object.keys(response.data.owner);
      // Get each key from response data and add it to the owner object
      for (const key of ownerDataArr) {
        owner[key] = response.data.owner[key];
      }
      // route.params.images = [];
      // response.data.images.forEach(image => {
      //   route.params.images.push(image);
      // });

      // owner.images = response.data.images;
      // route.params.images = response.data.images;
      isReadyToRender.value = true;
      // console.log('usage:', usage);
      // provide('fetchedImages', response.data.images);
    }

    // function changeHomeView(newView) {
    //   console.log('test:', newView);
    //   view.value = newView;
    // }
    // provide('changeHomeView', changeHomeView);

    // Define default toast configuration and provide
    const toast = new Notyf({
      position: { x: 'right', y: 'bottom' },
      duration: 2000,
      types: [
        {
          type: 'info'
        }
      ]
    });
    provide('toast', toast);

    return {
      // view,
      route,
      isReadyToRender,
      owner,
      images,
      usage
    };
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
  @apply absolute -top-4 right-1 h-8 bg-transparent hover:bg-transparent;
}

/* Page transitions */
.slide-enter {
  transform: translate(2em, 0);
  opacity: 0;
}

.slide-enter-to,
.slide-leave {
  opacity: 1;
  transform: translate(0, 0);
}

.slide-leave-to {
  transform: translate(-2em, 0);
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition-duration: 0.1s;
  transition-property: height, opacity, transform;
  transition-timing-function: cubic-bezier(0.55, 0, 0.1, 1);
  overflow: hidden;
}
</style>
