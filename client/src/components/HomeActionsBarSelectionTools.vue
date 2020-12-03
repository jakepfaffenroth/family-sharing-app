<template>
  <div class="flex xl:justify-end w-full">
    <div class="hidden lg:flex">
      <h4 class="font-lg font-black my-auto">
        Actions:
      </h4>
      <div class="flex overflow-x-scroll">
        <toolbar-button
          data-test="selectToolsAlbums"
          :class="{
            'disabled-bar-item': selectedImages.length === 0
          }"
          @click="openAlbumPicker"
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
          <span class="hidden lg:inline-block">to album</span>
        </toolbar-button>
        <toolbar-button
          data-test="selectToolsShare"
          :class="{
            'disabled-bar-item': selectedImages.length === 0
          }"
          @click="openShareModal"
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
        </toolbar-button>
        <toolbar-button
          :class="{
            'disabled-bar-item': selectedImages.length === 0
          }"
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
        </toolbar-button>
        <toolbar-button
          data-test="selectToolsDelete"
          :class="{
            'disabled-bar-item': selectedImages.length === 0
          }"
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
        </toolbar-button>
      </div>
    </div>
    <drop-menu
      id="collapsedSelectionTools"
      :position="'left'"
      class="block lg:hidden"
    >
      <template #button>
        <toolbar-button class="flex font-lg font-black my-auto pl-0">
          Actions
          <span>
            <svg
              class="w-4 mt-0.5 ml-1"
              xmlns="http://www.w3.org/2000/svg"
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
          </span>
        </toolbar-button>
      </template>
      <template #listItems>
        <div class="flex">
          <toolbar-button
            data-test="selectToolsAlbums"
            class="disabled-menu-item"
            :class="{
              'menu-item': selectedImages.length > 0
            }"
            @click="selectedImages.length > 0 ? openAlbumPicker : null"
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
            <span class="hidden lg:inline-block">to album</span>
          </toolbar-button>
          <toolbar-button
            data-test="selectToolsShare"
            class="disabled-menu-item"
            :class="{
              'menu-item': selectedImages.length > 0
            }"
            @click="selectedImages.length > 0 ? openShareModal : null"
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
          </toolbar-button>
          <toolbar-button
            class="disabled-menu-item"
            :class="{
              'menu-item': selectedImages.length > 0
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
          </toolbar-button>
          <toolbar-button
            data-test="selectToolsDelete"
            class="disabled-menu-item"
            :class="{
              'menu-item': selectedImages.length > 0
            }"
            @click="selectedImages.length > 0 ? null : null"
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
          </toolbar-button>
        </div>
      </template>
    </drop-menu>

    <div class="flex-grow"></div>
    <toolbar-button
      data-test="selectToolsSelectAll"
      :class="{ 'text-teal-600': selectedImages.length > 0 }"
      @click="toggleSelectAll"
    >
      {{ selectedImages.length > 0 ? 'Clear selection' : 'Select all' }}
    </toolbar-button>
  </div>
</template>

<script>
import ToolbarButton from './BaseButtonImageToolbar';
import DropMenu from './BaseDropMenu';

export default {
  name: 'SelectionToolbar',
  components: { ToolbarButton, DropMenu },
  inject: ['toast', 'toggleSelectMode', 'openModal'],
  props: { filteredImages: { type: Array, default: () => [] } },
  data() {
    return {
      allSelected: false
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
    toggleSelectAll() {
      const numberSelected = this.$store.getters.selectedImages.length;

      if (!!numberSelected && numberSelected < this.filteredImages.length) {
        // some images are selected but not all - clear them
        this.allSelected = false;
        this.$store.dispatch('replaceSelectedImages', []);
      } else {
        // Either all are selected or none - inverse them
        this.allSelected = !this.allSelected;
        this.$store.dispatch(
          'replaceSelectedImages',
          this.allSelected ? this.filteredImages : []
        );
      }
    },
    openAlbumPicker(item) {
      if (this.selectedImages.length > 0) {
        this.openModal('HomeModalAlbumPicker', this.selectedImages);
      }
    },
    openShareModal(item) {
      if (this.selectedImages.length > 0) {
        // TODO - Should allow user to enter email addresses and
        // TODO - then sends the images in an email
        // TODO - Needs new modal?
      }
    },
    action(actionType) {}
  }
};
</script>

<style scoped>
.menu-icon {
  @apply inline-block -mt-1 mr-1 w-4;
}

.disabled-menu-item {
  @apply block w-full px-2 py-1 text-sm rounded cursor-default text-gray-400 hover:text-gray-400 transition;
}

.disabled-bar-item {
  @apply cursor-default text-gray-400 hover:text-gray-400;
}

.menu-item {
  @apply block w-full px-2 py-1 text-sm rounded cursor-pointer text-gray-800 hover:bg-teal-400 hover:text-white transition;
}

#collapsedSelectionTools {
  position: static;
}
</style>
