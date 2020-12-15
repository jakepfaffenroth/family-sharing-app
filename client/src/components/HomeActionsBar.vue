<template>
  <div
    class="sm:relative flex px-2 pb-1 sm:p-0 sm:pt-2 whitespace-nowrap transition-all duration-100"
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
      class="relative flex flex-wrap md:flex-nowrap flex-grow w-full text-sm font-medium"
    >
      <!-- Album picker drop down -->
      <div class="flex flex-grow h-7 sm:mr-12">
        <!-- Non-mobile -->
        <drop-menu
          :position="'left'"
          :passed-classes="'w-screen max-w-90vw sm:max-w-50vw'"
          class="hidden sm:block"
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
        <mobile-drop-menu :position="'upup full'" class="sm:hidden">
          <template #button>
            <toolbar-button
              class="flex flex-grow text-lg sm:text-base font-bold my-auto pl-0"
            >
              <!-- <span> -->
              <svg
                class="w-5 my-0.5 mr-1 ml-0.5"
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
        </mobile-drop-menu>
      </div>

      <!-- Select Mode Btn -- sm:order-last -->
      <toolbar-button
        v-if="userType === 'owner'"
        data-test="selectModeBtn"
        class="relative md:order-last right-0 ml-0 mr-1 mt-auto md:mt-0 text-center text-base sm:text-sm focus:outline-none transition font-medium"
        :class="{
          'text-teal-600': isSelectMode
        }"
        @click="toggleSelectMode"
      >
        {{ isSelectMode ? 'Cancel' : 'Select' }}
      </toolbar-button>

      <!-- Album or Selection Tools -->
      <div
        v-if="userType === 'owner'"
        class="md:relative flex flex-grow w-full md:mr-6"
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
  inject: ['sortImages', 'toggleSelectMode', 'setActiveGallery'],
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
