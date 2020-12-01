<template>
  <base-menu>
    <template #buttons>
      <div
        data-test="ownerMenu"
        class="relative flex rounded-lg shadow divide-x divide-gray-400 h-8 border border-transparent transition-colors"
      >
        <base-button-purple
          data-test="uploadBtn"
          class="uppy-select-files w-40 h-8 mt-0 px-5 rounded-l-lg rounded-r-none"
        >
          <svg
            class="menu-icon"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          Upload Files
        </base-button-purple>
        <base-drop-menu>
          <template #button>
            <button
              class="w-8 h-8 bg-teal-600 rounded-r-lg text-white hover:bg-teal-500 transition"
              data-test="menuBtn"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="menu-icon"
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
                <svg
                  class="menu-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                Share gallery
              </a>
              <a class="main-menu-link" @click="$emit('download-zip')">
                <svg
                  class="menu-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                  />
                </svg>
                Download all
              </a>
              <router-link
                :to="{
                  name: 'account',
                  params: { ownerId }
                }"
                class="main-menu-link"
                data-test="accountBtn"
              >
                <svg
                  class="menu-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Account
              </router-link>
              <a class="main-menu-link" data-test="logoutBtn" @click="logout">
                <svg
                  class="menu-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Log out
              </a>
              <a
                v-if="ownerId === 'devOwnerId'"
                class="main-menu-link"
                @click="nuke"
              >
                Nuke
              </a>
              <a
                v-if="ownerId === 'devOwnerId'"
                class="main-menu-link"
                data-test="toastBtn"
                @click="showToast"
              >
                Toast
              </a>
              <hr class="mt-1" />
              <home-menu-owner-usage></home-menu-owner-usage>
            </div>
          </template>
        </base-drop-menu>
      </div>
      <!-- <div class="flex w-full mt-2 px-2 justify-between">
        <button
          data-test="selectModeBtn"
          class="focus:outline-none transition duration-150 ease-in-out"
          :class="{
            'text-gray-700 hover:text-teal-500': !isSelectMode,
            'text-gray-400 cursor-default': isSelectMode
          }"
          @click="toggleSelectMode"
        >
          Select
        </button>
        <home-menu-image-sorter />
      </div> -->
    </template>
  </base-menu>
</template>

<script>
import axios from 'axios';
import BaseMenu from './BaseMenu';
import BaseDropMenu from './BaseDropMenu';
import BaseButtonPurple from './BaseButtonPurple';
import HomeMenuOwnerUsage from './HomeMenuOwnerUsage';
// import HomeMenuImageSorter from './HomeMenuImageSorter';

import logout from '../utils/logout';

export default {
  name: 'OwnerMenu',
  components: {
    BaseMenu,
    BaseDropMenu,
    BaseButtonPurple,
    HomeMenuOwnerUsage
    // HomeMenuImageSorter
  },
  inject: ['nuke', 'toast', 'toggleSelectMode'],
  // props: { owner: { type: Object, default: null } },
  props: { isSelectMode: { type: Boolean, default: false } },
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
  @apply block px-4 py-2 text-sm rounded cursor-pointer text-gray-800 hover:bg-purple-500 hover:text-white transition;
}

.menu-icon {
  @apply inline-block -mt-0.5 mr-1 w-4 h-4;
}
</style>
