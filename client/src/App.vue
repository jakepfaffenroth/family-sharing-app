<template>
  <div class="flex flex-col min-h-screen w-full ">
    <banner
      :show-banner="owner.ownerId && !isAuth"
      :btn-action="resendVerification"
    >
      <template #text>
        <svg
          class="w-5 mr-1"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clip-rule="evenodd"
          />
        </svg>
        Please verify your email
      </template>
      <template #button>
        Resend verification email
      </template>
    </banner>
    <router-view v-slot="{ Component }">
      <transition name="slide" mode="out-in">
        <component :is="Component" :user-type="userType" />
      </transition>
    </router-view>
  </div>
</template>

<script>
import axios from 'axios';
import getCookie from './utils/getCookie';
import toast from './utils/Toast';
import { ref, reactive, computed, provide, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useStore, mapState, mapGetters } from 'vuex';

import Home from './views/Home';
import Account from './views/Account';
import Banner from './components/BaseBanner';
import Toast from './utils/Toast';

export default {
  name: 'App',
  components: { Banner },
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

    const isAuth = computed(() => store.getters.isAuth);
    async function getOwnerData(id, userType) {
      await store.dispatch('getOwnerData', { id, userType });
      store.dispatch('getPlanDetails');
    }

    const owner = computed(() => store.state.ownerStore.owner);

    if (owner.value.deleted) {
      console.error('User deleted account - redirect');
      window.location.assign(server);
    }
    async function resendVerification() {
      const { status } = await axios.post(
        server + '/user/resend-owner-verification',
        {
          owner: owner.value
        }
      );
      if (status >= 200 && status < 300) {
        toast.success('Email sent');
      } else {
        toast.error('An error occured');
      }
    }

    return {
      route,
      userType,
      owner,
      isAuth,
      resendVerification
    };
  }
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
