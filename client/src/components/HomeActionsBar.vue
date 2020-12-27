<template>
  <div
    class="Xrelative sm:static flex px-2 pb-1 sm:p-0 sm:pt-2 whitespace-nowrap transition-all duration-100"
    :class="{
      'border-b-2 border-purple-200 mx-0 sm:mx-3 md:mx-4 lg:mx-6 xl:mx-8 ease-out':
        view.atTopOfPage,
      'px-0 sm:px-3 md:px-4 lg:px-6 xl:px-8 shadow-lg border-b-2 border-purple-200 ease-in': !view.atTopOfPage
    }"
  >
    <!-- Skeletons -->
    <div v-if="view.ownerLoading" class="flex w-full mt-1">
      <div class="flex">
        <skeleton class="w-20 pr-5 h-3 mb-2"></skeleton>
        <skeleton class="w-6 h-3 ml-2 mb-2"></skeleton>
        <skeleton class="w-28 pl-1 pr-3 h-3 ml-16 mb-2"></skeleton>
        <!-- <toolbar-button>test</toolbar-button> -->
        <!-- <skeleton class="w-12 h-3 mb-1"></skeleton> -->
      </div>
      <skeleton class="ml-auto w-12 h-3 mb-2"></skeleton>
    </div>

    <div
      v-else
      class="Xrelative flex flex-wrap md:flex-nowrap flex-grow w-full text-sm font-medium"
    >
      <!-- Album picker drop down -->
      <div class="Xrelative Xflex Xflex-grow h-7 sm:mr-12">
        <!-- Non-mobile -->
        <drop-menu
          :passed-classes="'w-screen max-w-90vw md:max-w-50vw'"
          class="hidden sm:block relative"
        >
          <template #button>
            <toolbar-button
              class="flex flex-grow text-base sm:font-lg font-bold my-auto pl-0"
            >
              <!-- <span> -->
              <svg
                class="w-4 my-0.5 mr-1 ml-0.5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
              <!-- </span> -->
              {{ activeGallery }}
              {{ activeGallery === 'All' ? 'Photos' : '' }}
            </toolbar-button>
          </template>
          <template #listItems="{closeMenu}">
            <actions-bar-album-picker
              :close-menu="closeMenu"
            ></actions-bar-album-picker>
          </template>
        </drop-menu>

        <!-- Mobile -->
        <mobile-drop-menu
          :width="'full'"
          :passed-classes="'w-screen max-w-90vw'"
          class="sm:hidden"
        >
          <template #button>
            <toolbar-button
              class="flex flex-grow text-lg sm:text-base font-bold my-auto pl-0"
            >
              <svg
                class="w-5 m-0.5 mr-1 ml-0.5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
              {{ activeGallery === 'All' ? 'All Photos' : activeGallery }}
            </toolbar-button>
          </template>
          <template #listItems="{closeMenu}">
            <actions-bar-album-picker
              :close-menu="closeMenu"
            ></actions-bar-album-picker>
          </template>
        </mobile-drop-menu>
      </div>

      <!-- Album or Selection Tools -->
      <div
        v-if="userType === 'owner'"
        class="hidden Xmd:block md:relative flex flex-grow w-full md:mr-6"
      >
        <div class="w-full overflow-x-hidden">
          <transition
            :name="isSelectMode ? 'full-slide' : 'full-slide-reverse'"
            mode="out-in"
          >
            <component
              :is="actionsBar"
              class="md:px-2 mb-0 text-sm"
              :active-gallery="activeGallery"
              :filtered-images="filteredImages"
              :user-type="userType"
            ></component>
          </transition>
        </div>
      </div>

      <!-- Select Mode Btn -->
      <toolbar-button
        v-if="userType === 'owner'"
        data-test="selectModeBtn"
        class="ml-auto mr-1 text-right mb-auto text-base sm:text-sm focus:outline-none transition font-medium"
        :class="{
          'text-teal-600': isSelectMode
        }"
        @click="toggleSelectMode"
      >
        {{ isSelectMode ? 'Cancel' : 'Select' }}
      </toolbar-button>

      <mobile-drop-menu>
        <template #button="{isMenuVisible}">
          <button
            class="w-6 h-6 ml-2 mr-1 rounded-full border-2 border-gray-800"
            :class="{ 'bg-purple-600 border-purple-600': isMenuVisible }"
          >
            <div
              class="flex w-5 h-auto my-auto p-0.5"
              :class="!isMenuVisible ? 'justify-between' : 'mb-0.5'"
            >
              <div
                class="justify-self-start w-1 h-1 rounded-full  transition"
                :class="
                  isMenuVisible
                    ? 'absolute bg-white transform origin-center w-4 h-0.5 translate-x-0.5x rotate-45'
                    : 'bg-gray-800'
                "
              ></div>
              <div
                class="justify-self-center bg-gray-800 w-1 h-1 rounded-full transition"
                :class="isMenuVisible ? 'absolute invisible' : 'visible'"
              ></div>
              <div
                class="justify-self-end w-1 h-1 rounded-full  transition"
                :class="
                  isMenuVisible
                    ? 'absolute bg-white transform origin-center w-4 h-0.5 translate-x-0.5x -rotate-45'
                    : 'bg-gray-800'
                "
              ></div>
            </div>
          </button>
          <!-- <toolbar-button>
            <svg
              class="w-6 sm:w-6 ml-2 mr-1"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </toolbar-button> -->
        </template>
        <template #listItems>
          <component
            :is="actionsBar"
            class="w-auto"
            :active-gallery="activeGallery"
            :filtered-images="filteredImages"
            :user-type="userType"
          ></component>
        </template>
      </mobile-drop-menu>
    </div>
  </div>
</template>

<script>
import AlbumTools from '../components/HomeActionsBarAlbumTools';
import SelectionTools from '../components/HomeActionsBarSelectionTools';
import Skeleton from '../components/BaseSkeletonImage';
import DropMenu from '../components/BaseDropMenu';
import MobileDropMenu from '../components/BaseDropMobile';
import ToolbarButton from './BaseButtonImageToolbar';
import ActionsBarAlbumPicker from './HomeActionsBarAlbumPicker';

export default {
  components: {
    AlbumTools,
    SelectionTools,
    Skeleton,
    DropMenu,
    MobileDropMenu,
    ToolbarButton,
    ActionsBarAlbumPicker
  },
  provide() {
    return { toggleSelectAll: this.toggleSelectAll };
  },
  inject: ['openModal', 'sortImages', 'toggleSelectMode', 'setActiveGallery'],
  props: {
    actionsBar: { type: String, default: 'AlbumTools' },
    isSelectMode: { type: Boolean, default: false },
    view: { type: Object, default: () => ({}) },
    activeGallery: { type: String, default: 'All' },
    filteredImages: { type: Array, default: () => [] },
    userType: { type: String, default: '' }
  },
  emits: ['toggle-select-mode', 'set-active-gallery'],
  data() {
    return {
      allSelected: false,
      sortAsc: true,
      ENABLE_SORTER: false
    };
  },
  computed: {
    albums() {
      return [
        {
          albumName: 'All',
          albumId: 0,
          images: [this.$store.getters.allImages]
        },
        ...this.$store.getters.albums
      ];
    },
    isOverflowing() {
      if (!this.$refs.albumList) return;
      return (
        this.$refs.albumList.offsetHeight < this.$refs.albumList.scrollHeight
      );
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
    }
  }
};
</script>

<style scoped>
.menu-item {
  @apply block w-full px-2 py-1 whitespace-normal text-sm rounded cursor-pointer text-gray-800 hover:bg-teal-400 hover:text-white transition;
}

.full-slide-enter-active {
  @apply transition-all duration-100 ease-out;
}

.full-slide-leave-active {
  @apply transition-all duration-100 ease-in;
}

.full-slide-enter-from {
  @apply transform translate-x-full;
}

.full-slide-leave-to {
  @apply transform -translate-x-full;
}
.full-slide-reverse-enter-active {
  @apply transition-all duration-100 ease-out;
}

.full-slide-reverse-leave-active {
  @apply transition-all duration-100 ease-in;
}

.full-slide-reverse-enter-from {
  @apply transform -translate-x-full;
}

.full-slide-reverse-leave-to {
  @apply transform translate-x-full;
}
</style>
