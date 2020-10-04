<template>
  <a href="/">
    <colorful-logo class="self-center sm:self-start" :content="'carousel'" />
  </a>
  <div
    class="flex flex-col items-center sm:items-end py-4 gap-y-4 mt-3 text-gray-700"
  >
    <div class="flex rounded-lg shadow divide-x divide-gray-400">
      <slot name="btnLabel">
        <button
          id="uppy-select-files"
          class="uppy-select-files combo-btn self-center w-40 px-5 font-medium leading-5 text-white bg-purple-500 rounded-l-lg active:bg-purple-600 hover:bg-purple-600 focus:shadow-outline-purple"
        >
          Upload Files
        </button>
      </slot>
      <drop-menu>
        <!-- :is-menu-visible="isMenuVisible" -->
        <!-- @mouseenter="isMenuVisible = true"
        @mouseleave="isMenuVisible = false" -->
        <template #listItems>
          <div class="p-1">
            <a class="main-menu-link" @click="toggleShare">Share</a>
            <a class="main-menu-link" @click="$refs.zip.downloadZip()">
              Download all photos
            </a>
            <a class="main-menu-link" @click="toggleShare">Account</a>
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
            <a class="main-menu-link text-purple-500 font-semibold text-center">
              Get more storage
            </a>
          </div>
        </template>
      </drop-menu>
    </div>

    <image-sorter />
  </div>

  <transition name="slide-fade">
    <modal
      v-show="isShareVisible"
      :share-url="`${server}/${owner.guestId}/guest`"
      @close-modal="toggleShare"
    />
  </transition>

  <download-zip ref="zip" :images="images" class="hidden" />
</template>

<script>
import axios from 'axios';

import ColorfulLogo from './ColorfulLogo';
import DropMenu from './DropMenu';
import ImageSorter from './ImageSorter';
import DownloadZip from './DownloadZip';
import Modal from './Modal';

export default {
  components: {
    ColorfulLogo,
    DropMenu,
    ImageSorter,
    DownloadZip,
    Modal
  },
  inject: ['owner', 'images', 'nuke', 'toast'],
  props: {
    usage: {
      type: Object,
      default: () => {
        return { gb: 0, mb: 0, kb: 0 };
      }
    }
  },
  emits: ['sort-images'],
  data() {
    return {
      server: process.env.VUE_APP_SERVER,
      isShareVisible: false,
      isMenuVisible: false,
      toastContent:
        '<div class="font-sm p-0"><p class="font-bold">Title</p><p>message content</p></div>'
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
    showToast() {
      this.toast.open({
        type: 'info',
        duration: 0,
        dismissible: true,
        message: this.toastContent
      });
    },
    toggleShare() {
      this.isShareVisible = !this.isShareVisible;
    },
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
