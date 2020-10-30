<template>
  <base-menu>
    <template #buttons>
      <div
        data-test="ownerMenu"
        class="flex rounded-lg shadow divide-x divide-gray-400 h-8 border border-transparent transition-colors duration-150"
      >
        <base-button-purple
          data-test="uploadBtn"
          class="uppy-select-files w-40 h-8 mt-0 px-5 rounded-l-lg rounded-r-none"
        >
          Upload Files
        </base-button-purple>
        <base-drop-menu>
          <template #button>
            <button
              class="w-8 h-8 bg-teal-600 rounded-r-lg hover:bg-teal-500"
              data-test="menuBtn"
            >
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
            </button>
          </template>
          <template #listItems>
            <div class="w-46">
              <a
                class="main-menu-link"
                data-test="openShareModalBtn"
                @click="$emit('open-modal', 'HomeModalShare')"
              >
                Share
              </a>
              <a class="main-menu-link" @click="$emit('download-zip')">
                Download all photos
              </a>
              <router-link
                :to="{
                  name: 'account',
                  params: { ownerId }
                }"
                class="main-menu-link"
                data-test="accountBtn"
              >
                Account
              </router-link>
              <a class="main-menu-link" data-test="logoutBtn" @click="logout">Log out</a>
              <a class="main-menu-link" @click="nuke">Nuke</a>
              <a class="main-menu-link" data-test="toastBtn" @click="showToast">
                Toast
              </a>
              <hr class="mt-1" />
              <home-menu-owner-usage></home-menu-owner-usage>
            </div>
          </template>
        </base-drop-menu>
      </div>
      <home-menu-image-sorter />
    </template>
  </base-menu>
</template>

<script>
import axios from 'axios';
import BaseMenu from './BaseMenu';
import BaseDropMenu from './BaseDropMenu';
import BaseButtonPurple from './BaseButtonPurple';
import HomeMenuOwnerUsage from './HomeMenuOwnerUsage';
import HomeMenuImageSorter from './HomeMenuImageSorter';

import logout from '../utils/logout';

export default {
  name: 'OwnerMenu',
  components: {
    BaseMenu,
    BaseDropMenu,
    BaseButtonPurple,
    HomeMenuOwnerUsage,
    HomeMenuImageSorter
  },
  inject: ['nuke', 'toast'],
  // props: { owner: { type: Object, default: null } },
  emits: ['open-modal', 'download-zip'],
  data() {
    return {
      logout
    };
  },
  // TODO - Move this usage stuff to a new component
  // This component should only be the menu and list items
  computed: {
    ownerId() {
      return this.$store.getters.ownerId;
    }
    // ...mapGetters('planStore', [
    //   'storagePercentage',
    //   'usageValue',
    //   'usageBarWidth',
    //   'usageBarColor',
    // ]),
  },
  methods: {
    showToast() {
      this.toast.open({
        type: 'info',
        duration: 0,
        dismissible: true,
        message:
          '<div class="font-sm p-0"><p class="font-bold">Title</p><p>message content</p></div>'
      });
    }
  }
};
</script>

<style>
.main-menu-link {
  @apply block px-4 py-2 text-sm rounded cursor-pointer text-gray-800 hover:bg-purple-500 hover:text-white;
}
</style>
