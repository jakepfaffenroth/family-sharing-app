<template>
  <div
    class="flex flex-col min-h-screen w-full px-2 py-2 sm:px-6 sm:py-4 xl:px-12 xl:py-6"
  >
    <router-view :user-type="userType"></router-view>
  </div>
</template>

<script>
// import axios from 'axios';
import toast from './utils/Toast';
import { ref, reactive, computed, provide, onErrorCaptured } from 'vue';
import { useRoute } from 'vue-router';
import { useStore, mapState, mapGetters } from 'vuex';

import Home from './views/Home';
import Account from './views/Account';

export default {
  name: 'App',
  provide: { toast },
  setup() {
    var err = new Error();
    const store = useStore();
    const route = useRoute();
    const server = process.env.VUE_APP_SERVER;

    const ownerId = getCookie('ownerId');
    const guestId = getCookie('guestId');
    let userType = ref('');
    store.dispatch('saveIdCookies', { ownerId, guestId });

    if (ownerId) {
      userType.value = 'owner';
      getOwnerData(ownerId, 'owner');
    }
    if (guestId && !ownerId) {
      userType.value = 'guest';
      getOwnerData(guestId, 'guest');
    }
    // Prevent users from viewing app without login or guestId
    if (!guestId && !ownerId) {
      window.location.assign(server);
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

    async function getOwnerData(id, userType) {
      await store.dispatch('getOwnerData', { id, userType });
    }

    // Define default toast configuration and provide
    // const toast = new Notyf({
    //   position: { x: 'right', y: 'bottom' },
    //   duration: 2000,
    //   types: [
    //     {
    //       type: 'info',
    //       background: '#2563eb'
    //     }
    //   ]
    // });

    return {
      route,
      userType
      // owner: computed(() => store.state.ownerStore.owner),
      // images: computed(() => store.state.imageStore.images)
    };
  }
  // computed: mapState({
  //   owner: (state) => state.ownerStore.owner,
  //   images: (state) => state.imageStore.images,
  // }),
};
</script>

<style>
.notyf__toast {
  @apply flex justify-between content-center w-64 h-auto p-0 rounded text-sm font-light;
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

/* Modal and drop menu transitions */
.slide-fade-enter-active {
  @apply transition-all duration-200 ease-out;
}

.slide-fade-leave-active {
  @apply transition-all duration-150 ease-in;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  @apply transform -translate-y-2 opacity-0;
}
</style>
