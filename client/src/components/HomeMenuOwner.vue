<template>
  <base-menu>
    <template #buttons>
      <div
        class="flex rounded-lg shadow divide-x divide-gray-400 h-8 border border-transparent transition-colors duration-150"
      >
        <base-button-purple
          id="uppy-select-files"
          class="uppy-select-files w-40 h-8 mt-0 px-5 rounded-l-lg rounded-r-none"
        >
          Upload Files
        </base-button-purple>
        <base-drop-menu>
          <template #btnLabel>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="m-auto mt-1 h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </template>
          <template #listItems>
            <div class="p-1">
              <a class="main-menu-link" @click="$emit('open-share-modal')">
                Share
              </a>
              <a class="main-menu-link" @click="$emit('download-zip')">
                Download all photos
              </a>
              <router-link
                :to="{ name: 'account', params: { ownerId: owner.ownerId } }"
                class="main-menu-link"
              >
                Account
              </router-link>
              <a class="main-menu-link" @click="logout">Log out</a>
              <a class="main-menu-link" @click="nuke">Nuke</a>
              <a class="main-menu-link" @click="showToast">Toast</a>
              <hr class="mt-1" />
              <div class="mt-3 mb-1 text-center text-sm text-teal-500">
                <p>
                  You've used
                </p>
                <p>
                  {{ usageValue.value }} {{ usageValue.unit }} of
                  {{ owner.quota / 1000 }} GB
                </p>
                <div
                  class="relative flex h-2 w-5/6 my-2 mx-auto rounded-sm overflow-hidden"
                >
                  <div
                    class="left-0 h-full border rounded-l-sm"
                    :class="'bg-' + quotaColor + ' border-' + quotaColor"
                    :style="quotaWidth"
                  ></div>
                  <div
                    class="flex-grow border-t border-b border-r border-gray-400 rounded-r-sm"
                  ></div>
                </div>
              </div>
              <router-link
                :to="{ name: 'account', params: { goToChangePlan: true } }"
                class="main-menu-link text-purple-500 font-semibold text-center"
              >
                Get more storage
              </router-link>
            </div>
          </template>
        </base-drop-menu>
      </div>
      <home-menu-image-sorter />
    </template>
  </base-menu>

  <!-- <home-download-zip ref="zip" :images="images" class="hidden" /> -->
</template>

<script>
import { defineAsyncComponent } from 'vue';
import axios from 'axios';
import BaseMenu from './BaseMenu';
import BaseDropMenu from './BaseDropMenu';
import BaseButtonPurple from './BaseButtonPurple';
import HomeMenuImageSorter from './HomeMenuImageSorter';
// import HomeDownloadZip from './HomeDownloadZip';
import Account from '../views/Account';
// import HomeModalShare from './HomeModalShare';

// const HomeDownloadZip = defineAsyncComponent(() => import('./HomeDownloadZip'));

export default {
  components: {
    BaseMenu,
    BaseDropMenu,
    BaseButtonPurple,
    HomeMenuImageSorter
    // HomeDownloadZip
  },
  inject: ['images', 'nuke', 'toast'],
  props: {
    owner: { type: Object, default: null },
    usage: {
      type: Object,
      default: () => {
        return { gb: 0, mb: 0, kb: 0 };
      }
    }
  },
  emits: ['sort-images', 'open-share-modal', 'download-zip'],
  data() {
    return {
      server: process.env.VUE_APP_SERVER,

      isMenuVisible: false,
      toastContent:
        '<div class="font-sm p-0"><p class="font-bold">Title</p><p>message content</p></div>',
      Account: Account
    };
  },
  computed: {
    storagePercentage() {
      return (this.usage.mb / this.owner.quota) * 100;
    },
    usageValue() {
      if (this.usage.gb >= 1)
        return { value: this.usage.gb.toFixed(2), unit: 'GB' };
      else if (this.usage.mb >= 1)
        return { value: this.usage.mb.toFixed(2), unit: 'MB' };
      else return { value: this.usage.kb.toFixed(2), unit: 'KB' };
    },
    quotaWidth() {
      return this.storagePercentage > 2
        ? 'width: ' + this.storagePercentage + '%'
        : 'width: ' + 2 + '%';
    },
    quotaColor() {
      if (this.storagePercentage < 40) {
        return 'green-400';
      } else if (this.storagePercentage < 90) {
        return 'orange-400';
      } else {
        return 'red-500';
      }
    }
  },
  // mounted() {
  //   const ddMenuEls = document.getElementsByClassName('ddMenu');
  //   for (const el of ddMenuEls) {
  //     el.addEventListener('mouseenter', () => {
  //       this.isMenuVisible = true;
  //     });
  //     el.addEventListener('mouseleave', () => {
  //       this.isMenuVisible = false;
  //     });
  //   }
  // },
  methods: {
    // changeView(newView) {
    //   this.changeHomeView(Account);
    //   this.$router.push({ path: '/account/' + this.owner.ownerId });
    // },
    showToast() {
      this.toast.open({
        type: 'info',
        duration: 0,
        dismissible: true,
        message: this.toastContent
      });
    },
    // ! Zip download is broken
    downloadZip() {
      this.$refs.zip.downloadZip;
    },
    logout() {
      axios.get(`${this.server}/logout`);
      document.cookie =
        'ownerId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;Secure';
      document.cookie =
        'connect.sid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;Secure';
      window.location.replace(`${this.server}/login`);
    }
  }
};
</script>

<style>
.combo-btn {
  @apply h-8 border border-transparent transition-colors duration-150 focus:outline-none;
}

.upload-btn {
  @apply self-center w-40 px-5 font-medium leading-5 rounded-l-lg rounded-r-none;
}

.sort-btn {
  @apply px-2;
}

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
