<template>
  <!-- <component
    :is="view"
    :owner="owner"
    :images="images"
    :usage="usage"
  ></component> -->

  <router-view :owner="owner" :images="images" :usage="usage"></router-view>

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
</template>

<script>
import axios from 'axios';
import { ref, shallowRef, reactive, provide } from 'vue';
import { Notyf } from 'notyf';
import 'notyf/notyf.min.css';
import { useRoute } from 'vue-router';

import Home from './views/Home';
import Account from './views/Account';

export default {
  // components: { Home },
  setup() {
    console.log('in App');
    const route = useRoute();
    const server = process.env.VUE_APP_SERVER;
    const isReadyToRender = ref(false);
    // const view = shallowRef(Home);

    // provide('changeView', newView => {
    //   console.log('view.value:', view.value);
    //   view.value = newView;
    //   console.log('view.value:', view.value);
    // });

    const owner = reactive({});
    const usage = ref('');
    const images = ref([]);

    provide('owner', owner);
    provide('usage', usage.value);
    provide('images', images.value);

    // -------------------------------------
    // ------ INITIAL CONFIGURATION --------
    // ------------ & COOKIES --------------

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
          id = { ownerId: ownerId };
          break;
        case 'guest':
          url = `${server}/user/get-owner`;
          id = { guestId: guestId };
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

      if (!response.data.isLoggedIn) {
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

    const toast = new Notyf({
      position: { x: 'right', y: 'top' },
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
