<template>
  <div class="text-base sm:text-sm">
    <button
      data-test="selectToolsSelectAll"
      :data-btn_action="selectedImages.length > 0 ? 'clear' : 'select'"
      :data-ok_to_close="!selectedImages.length"
      class="menu-item-sm menu-item-teal"
      :class="{ 'text-teal-600': selectedImages.length > 0 }"
      @click.capture="toggleSelectAllBtn"
    >
      <!-- @click="test" -->
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
          d="M5 13l4 4L19 7"
        />
      </svg>
      {{ selectedImages.length > 0 ? 'Clear selection' : 'Select all' }}
    </button>
    <button
      data-test="selectToolsAlbums"
      class="select-tool menu-item-sm disabled-menu-item"
      :class="{
        'enabled-menu-item': selectedImages.length > 0
      }"
      @click="selectedImages.length > 0 ? openAlbumPicker() : null"
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
      <span class="Xhidden md:inline-block">to album</span>
    </button>
    <button
      v-if="activeGallery !== 'All'"
      class="select-tool menu-item-sm disabled-menu-item"
      :class="{
        'enabled-menu-item': selectedImages.length > 0
      }"
      @click.stop="removeFromAlbum($event)"
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
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
      Remove
      <span class="Xhidden md:inline-block">from album</span>
    </button>
    <button
      v-if="ENABLED"
      data-test="selectToolsShare"
      class="select-tool menu-item-sm disabled-menu-item"
      :class="{
        'pointer-events-none': selectedImages.length == 0,
        'enabled-menu-item': selectedImages.length > 0
      }"
      @click="openShareModal($event)"
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
      Share
    </button>
    <button
      v-if="ENABLED"
      class="select-tool menu-item-sm disabled-menu-item"
      :class="{
        'enabled-menu-item': selectedImages.length > 0
      }"
      @click="selectedImages.length > 0 ? null : null"
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
          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
        />
      </svg>
      Hide
    </button>
    <button
      data-test="selectToolsDelete"
      class="select-tool menu-item-sm disabled-menu-item"
      :class="{
        'enabled-menu-item': selectedImages.length > 0
      }"
      @click="openDeleteModal($event)"
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
      Delete
      <span class="Xhidden md:inline-block">Photos</span>
    </button>
  </div>
</template>

<script>
// import SelectAllButton from './HomeActionsBarButtonSelectAll';

export default {
  name: 'SelectionToolbar',
  // components: { SelectAllButton },
  inject: ['toast', 'toggleSelectMode', 'openModal', 'toggleSelectAll'],
  props: {
    activeGallery: { type: String, default: null },
    filteredImages: { type: Array, default: () => [] }
  },
  data() {
    return {
      allSelected: false,
      ENABLED: false
    };
  },
  computed: {
    owner() {
      return this.$store.getters.owner;
    },
    images() {
      return this.$store.getters.images;
    },
    albums() {
      return this.$store.getters.albums;
    },
    selectedImages() {
      return this.$store.getters.selectedImages;
    }
  },
  methods: {
    openAlbumPicker(event) {
      // if (this.selectedImages.length > 0) {
      this.openModal('HomeModalAlbumPicker', {
        imgInfo: this.selectedImages
      });
      // }
    },
    removeFromAlbum(event) {
      // if (this.selectedImages.length > 0) {
      this.openModal('HomeModalAlbumPicker', {
        imgInfo: this.selectedImages,
        modalSwitch: 'removeFromAlbum'
      });
      // }
    },
    openDeleteModal(event) {
      // if (this.selectedImages.length > 0) {
      this.openModal('HomeModalDeleteImage', {
        imgInfo: this.selectedImages
      });
      // }
    },
    openShareModal(event) {
      // TODO - Should allow user to enter email addresses and
      // TODO - then sends the images in an email
      // TODO - Needs new modal?
    },
    toggleSelectAllBtn() {
      this.toggleSelectAll();
      if (this.selectedImages.length === 0) {
        console.log('this.selectedImages.length:', this.selectedImages.length);
      }
    }
  }
};
</script>

<style scoped>
/* .menu-icon {
  @apply inline-block -mt-1 w-4 h-4;
} */

.main-menu-link {
  @apply px-4 py-2 text-sm rounded cursor-pointer text-gray-800 hover:bg-purple-500 hover:text-white transition;
}

.disabled-menu-item {
  @apply block w-full cursor-default bg-transparent text-gray-400 hover:text-gray-400 transition pointer-events-none;
}

/* .disabled-bar-item {
  @apply cursor-default text-gray-400 hover:text-gray-400;
} */

.enabled-menu-item {
  @apply block w-full rounded cursor-pointer text-gray-800 hover:bg-teal-400 hover:text-white transition pointer-events-auto;
}

#collapsedSelectionTools {
  position: static;
}
</style>
