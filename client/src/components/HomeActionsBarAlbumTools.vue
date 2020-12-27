<template>
  <div class="flex flex-col text-base sm:text-sm">
    <button
      v-if="activeGallery !== 'All'"
      class="menu-item-sm menu-item-purple"
      @click="
        openModal('HomeModalPhotoPicker', { activeGallery }),
          toast.success('open photo picker modal')
      "
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
          d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z"
        />
      </svg>
      Add
      <span class="smX:hidden md:inline-block">photos</span>
    </button>
    <button
      class="menu-item-sm menu-item-purple"
      @click="openModal('HomeModalNewAlbum')"
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
          d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
        />
      </svg>
      New
      <span class="smX:hidden md:inline-block">Album</span>
    </button>
    <button
      v-show="activeGallery !== 'All'"
      class="menu-item-sm menu-item-purple"
      @click="openModal('HomeModalDeleteAlbum', { activeGallery })"
    >
      <svg
        class="menu-icon"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
      </svg>
      Remove
      <span class="smX:hidden lg:inline-block">Album</span>
    </button>
  </div>
</template>

<script>
import { useStore } from 'vuex';
import { ref, reactive, computed, onMounted, nextTick } from 'vue';

export default {
  name: 'HomeActionsBarAlbumTools',
  inject: ['setActiveGallery', 'openModal', 'toast'],
  props: {
    activeGallery: { type: String, default: 'All' },
    userType: { type: String, default: '' },
    closeMenu: { type: Function, default: () => {} }
  },
  computed: {
    albums() {
      return this.$store.getters.albums;
    }
  }
};
</script>

<style scoped>
/* .menu-icon {
  @apply inline-block w-4 mb-0.5 mr-0 sm:ml-0.5;
} */

.menu-item {
  @apply block w-full px-2 py-1 text-sm rounded cursor-pointer text-gray-800 hover:bg-teal-400 hover:text-white transition;
}
</style>
