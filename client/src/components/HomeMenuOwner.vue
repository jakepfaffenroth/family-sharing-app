<template>
  <base-menu>
    <template #buttons>
      <!-- Non-mobile -->
      <div
        data-test="ownerMenu"
        class="hidden relative sm:flex rounded-lg h-8 shadow transition-colors"
      >
        <base-button-purple
          data-test="uploadBtn"
          class="uppy-select-files w-40 h-8 mt-0 pr-0.5 border-r border-gray-400 mx-auto rounded-l-lg rounded-r-none"
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
                @click="NUKE"
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

      <!-- Mobile -->
      <div
        data-test="ownerMenu"
        class="relative sm:hidden h-8 w-8 rounded-full transition-colors"
      >
        <base-drop-mobile
          :btn-position-tweak="'-mt-3 pt-0.5'"
          :list-position-tweak="'top-2'"
        >
          <template #button="{isMenuVisible}">
            <button
              class="w-8 h-8 rounded-full text-white transition"
              :class="{ 'bg-purple-600 shadow-lg': isMenuVisible }"
              data-test="menuBtn"
            >
              <div
                class="relative flex flex-col w-5 h-5 mx-auto py-1"
                :class="{
                  'justify-between': !isMenuVisible
                }"
              >
                <div
                  class="w-full h-0.5 rounded transition"
                  :class="
                    isMenuVisible
                      ? 'absolute top-1/2 bg-white transform origin-center rotate-45'
                      : 'bg-purple-600'
                  "
                ></div>
                <div
                  class="bg-purple-600 w-full h-0.5 rounded transition"
                  :class="isMenuVisible ? 'invisible' : 'visible'"
                ></div>
                <div
                  class=" w-full h-0.5 rounded transition"
                  :class="
                    isMenuVisible
                      ? 'absolute top-1/2 bg-white transform origin-center -rotate-45'
                      : 'bg-purple-600'
                  "
                ></div>
              </div>
            </button>
          </template>
          <template #listItems>
            <div class="mt-2 w-46">
              <a
                class="main-menu-link uppy-select-files"
                data-test="openShareModalBtn"
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
                Upload
              </a>
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
                @click="NUKE"
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
        </base-drop-mobile>
      </div>
    </template>
  </base-menu>
</template>

<script>
import http from '../utils/http';
import BaseMenu from './BaseMenu';
import BaseDropMenu from './BaseDropMenu';
import BaseDropMobile from './BaseDropMobile';
import BaseButtonPurple from './BaseButtonPurple';
import HomeMenuOwnerUsage from './HomeMenuOwnerUsage';

import logout from '../utils/logout';

export default {
  name: 'OwnerMenu',
  components: {
    BaseMenu,
    BaseDropMenu,
    BaseDropMobile,
    BaseButtonPurple,
    HomeMenuOwnerUsage
  },
  inject: ['NUKE', 'toast', 'toggleSelectMode'],
  props: { isSelectMode: { type: Boolean, default: false } },
  emits: ['open-modal', 'download-zip'],
  data() {
    return {
      logout
    };
  },
  // TODO - Move this usage stuff to a new component?
  // This component should only be the menu and list items
  computed: {
    ownerId() {
      return this.$store.getters.ownerId;
    }
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
