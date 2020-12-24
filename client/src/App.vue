<template>
  <div class="flex flex-col min-h-screen w-full ">
    <router-view v-slot="{ Component }">
      <transition name="slide">
        <component :is="Component" :user-type="userType" />
      </transition>
    </router-view>
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
    const store = useStore();
    const route = useRoute();
    const server = process.env.VUE_APP_SERVER;

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

    const ownerId = getCookie('ownerId') || null;
    const guestId = getCookie('guestId') || null;
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
      console.error('No cookies found - redirect');
      window.location.assign(server);
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

    // document.addEventListener('click', event => closeDropMenus(event));

    // function getDropListEl(target) {
    //   // console.log('target:', target ? target.classList.value : 'null');
    //   try {
    //     if (target === null) {
    //       return null;
    //     }
    //     if (!target.classList.value.includes('dropMenu')) {
    //       getDropListEl(target.parentElement);
    //     }
    //     return target;
    //   } catch (err) {
    //     // console.error(err);
    //     return null;
    //   }
    // }

    // // Close drop menus
    // let menuToClose = null;
    // function closeDropMenus(event, menuId) {
    //   console.log('event:', event);

    //   const dropList = getDropListEl(event.target);
    //   console.log('dropList:', dropList);
    //   // console.log('event.target:', event.target);
    //   // // First find any open menus
    //   if (menuToClose) {
    //     console.log('now close');
    //     menuToClose = parseInt(openMenu[0].dataset.menu_id);
    //   } else {
    //     console.log('no menu open');
    //   }
    //   const openMenu = document.getElementsByClassName('menuOpen');

    //   // console.log(
    //   //   'open menu:',
    //   //   openMenu.length ? parseInt(openMenu[0].dataset.menu_id) : 'null'
    //   // );
    //   // console.log('clicked menu:', menuId);

    //   // If open menu found, return it
    //   // if (openMenu.length) {
    //   //   return openMenu;
    //   // } else {
    //   //   return null;
    //   // }
    // }
    // provide('closeDropMenus', closeDropMenus);
    // provide('menuToClose', () => menuToClose);

    return {
      route,
      userType,
    };
  },
};
</script>

<style>
.Q {
  @apply border-2 border-red-500;
}

.notyf__toast {
  @apply relative bottom-4 right-2 md:bottom-0 md:right-0 flex justify-between content-center w-64 h-auto p-0 rounded text-sm font-light;
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

/* Album and Account section transitions */
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

/* General fade in transitions */
.fade-enter-active {
  @apply transition-all duration-200 ease-out;
}

.fade-leave-active {
  @apply transition-all duration-150 ease-in;
}

.fade-enter-from,
.fade-leave-to {
  @apply opacity-0;
}
</style>
