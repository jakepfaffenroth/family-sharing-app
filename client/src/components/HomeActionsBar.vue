<template>
  <div
    class="relative flex pt-2 whitespace-nowrap transition-all duration-100"
    :class="{
      'border-b-2 border-purple-200 mx-0 sm:mx-6 xl:mx-12 ease-out':
        view.atTopOfPage,
      'px-0 sm:px-6 xl:px-12 shadow-lg border-b-2 border-purple-200 ease-in': !view.atTopOfPage
    }"
  >
    <div
      v-if="view.ownerLoading"
      class="flex items-end p-2 pt-3 text-center text-sm font-medium space-x-12"
    >
      <skeleton class="w-16 h-3 mb-1 -mr-6"></skeleton>
      <skeleton class="w-8 h-3 mb-1"></skeleton>
      <skeleton class="w-16 h-3 mb-1"></skeleton>
      <skeleton class="w-12 h-3 mb-1"></skeleton>
    </div>

    <div v-else class="flex w-full text-sm font-medium flex-grow">
      <div class="flex mr-12">
        <drop-menu :position="'left'">
          <template #button>
            <toolbar-button class="flex font-lg font-black my-auto pl-0">
              Albums
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
            <actions-bar-album-picker></actions-bar-album-picker>
          </template>
        </drop-menu>
        <h4>
          {{ activeGallery }}
        </h4>
      </div>
      <div v-if="userType === 'owner'" class="relative flex flex-grow">
        <div class="overflow-x-hidden">
          <transition
            :name="isSelectMode ? 'full-slide' : 'full-slide-reverse'"
            mode="out-in"
          >
            <component
              :is="actionsBar"
              class="flex px-2 mb-1  text-sm font-medium"
              :active-gallery="activeGallery"
              :filtered-images="filteredImages"
              :user-type="userType"
            ></component>
          </transition>
        </div>
      </div>

      <div class="flex ml-auto">
        <toolbar-button
          v-if="userType === 'owner'"
          data-test="selectModeBtn"
          class="ml-2 pr-1 mb-1 text-center focus:outline-none transition font-medium"
          :class="{
            'text-teal-600': isSelectMode
          }"
          @click="toggleSelectMode"
        >
          {{ isSelectMode ? 'Cancel' : 'Select' }}
        </toolbar-button>
        <div
          v-if="ENABLE_SORTER"
          class="flex mx-1 divide-x divide-gray-600 text-gray-700 transition duration-150 ease-in-out"
        >
          <drop-menu>
            <template #button>
              <toolbar-button
                class="mr-2 text-center font-medium hover:text-teal-600 focus:outline-none cursor-pointer"
              >
                Sort
              </toolbar-button>
            </template>
            <template #listItems>
              <div class="w-32 -m-1">
                <a class="menu-item" @click="sortImages('captureTime')">
                  Capture time
                </a>
                <a class="menu-item" @click="sortImages('uploadTime')">
                  Date uploaded
                </a>
              </div>
            </template>
          </drop-menu>

          <button
            class="my-1 pl-2 hover:text-teal-600 focus:outline-none transition "
            @click="sortImages('reverse'), (sortAsc = !sortAsc)"
          >
            <svg class="m-auto h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <!-- Version for sort:ascending -->
              <path
                v-if="sortAsc"
                d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h5a1 1 0 000-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM13 16a1 1 0 102 0v-5.586l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 101.414 1.414L13 10.414V16z"
              />
              <!-- Version for sort:descending -->
              <path
                v-else
                d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h7a1 1 0 100-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z"
              />
            </svg>
          </button>
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
import ToolbarButton from './BaseButtonImageToolbar';
import ActionsBarAlbumPicker from './HomeActionsBarAlbumPicker';

export default {
  components: {
    AlbumTools,
    SelectionTools,
    Skeleton,
    DropMenu,
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
