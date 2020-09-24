<template>
  <colorful-logo class="self-center sm:self-start" :content="'carousel'" />
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
            <a class="main-menu-link" @click="logout">Log out</a>
            <a class="main-menu-link" @click="nuke">Nuke</a>
            <a class="main-menu-link" @click="showToast">Toast</a>
          </div>
        </template>
      </drop-menu>
    </div>

    <image-sorter />

    <!-- <div class="flex justify-end content-center divide-x divide-gray-600">
      <button class="sort-btn" @click="$emit('sort-images', 'uploadTime')">
        Sort by date uploaded
      </button>
      <button class="sort-btn" @click="$emit('sort-images', 'captureTime')">
        Sort by capture time
      </button>
      <button
        class="sort-btn"
        @click="$emit('sort-images', 'reverse'), (sortAsc = !sortAsc)"
      >
        <svg
          v-if="sortAsc"
          class="m-auto h-4 w-4"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h5a1 1 0 000-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM13 16a1 1 0 102 0v-5.586l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 101.414 1.414L13 10.414V16z"
          />
        </svg>
        <svg
          v-if="!sortAsc"
          class="m-auto h-4 w-4"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h7a1 1 0 100-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z"
          />
        </svg>
      </button>
    </div> -->
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
  inject: ['owner', 'images', 'nuke', 'toast', 'swal', 'toastify'],
  emits: ['sort-images'],
  data() {
    return {
      server: process.env.VUE_APP_SERVER,
      isShareVisible: false,
      isMenuVisible: false,
      toastContent:
        '<div class="font-sm p-0"><p class="font-bold">Title</p><p>message content</p></div>'
      // sortAsc: true
    };
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
