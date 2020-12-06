<template>
  <div>
    <toolbar-button
      v-show="activeGallery !== 'All'"
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
      <span class="hidden md:inline-block">to Album</span>
    </toolbar-button>
    <toolbar-button @click="openModal('HomeModalNewAlbum')">
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
      <span class="hidden md:inline-block">Album</span>
    </toolbar-button>
    <toolbar-button
      v-show="activeGallery !== 'All'"
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
      <span class="hidden lg:inline-block">Album</span>
    </toolbar-button>
  </div>
</template>

<script>
import ToolbarButton from './BaseButtonImageToolbar';
import { useStore } from 'vuex';
import { ref, reactive, computed, onMounted, nextTick } from 'vue';

export default {
  name: 'HomeActionsBarAlbumTools',
  components: {
    ToolbarButton
  },
  inject: ['setActiveGallery', 'openModal', 'toast'],
  props: {
    activeGallery: { type: String, default: 'All' },
    userType: { type: String, default: '' }
  },
  computed: {
    albums() {
      return this.$store.getters.albums;
    }
  }
};
</script>

<style scoped>
.menu-icon {
  @apply inline-block -mt-0.5 w-4;
}

.menu-item {
  @apply block w-full px-2 py-1 text-sm rounded cursor-pointer text-gray-800 hover:bg-teal-400 hover:text-white transition;
}
</style>
