<template>
  <!-- <div class="flex w-full whitespace-nowrap"> -->
  <!-- <h4 class="font-lg font-black my-auto">
    Albums:
  </h4> -->
  <!-- <div ref="albumTabs" class="flex flex-nowrap flex-shrink overflow-x-hidden">
    <toolbar-button
      v-for="album in albums"
      :key="album"
      :data-test="'albumTab-' + album.albumName"
      class="mx-0"
      :class="{
        'text-purple-600': activeGallery === album.albumName,
        'hover:text-purple-600': activeGallery !== album.albumName
      }"
      @click="setActiveGallery(album.albumName)"
    >
      {{ album.albumName }}
    </toolbar-button>
  </div>
  <base-drop-menu v-if="collapsedTabs.length">
    <template #button>
      <div ref="overflowMenu">
        <toolbar-button ref="overflowMenu">
          ###
        </toolbar-button>
      </div>
    </template>
    <template #listItems>
      <div class="w-36 -m-1">
        <button
          v-for="album in collapsedTabs"
          :key="album.albumName"
          class="menu-item"
          @click="setActiveGallery(album.albumName)"
        >
          {{ album.albumName }}
        </button>
      </div>
    </template>
  </base-drop-menu> -->
  <!-- <div class="flex-grow"></div> -->
  <div v-if="userType === 'owner'">
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
          d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z"
        />
      </svg>
      Add
      <span class="hidden lg:inline-block">Album</span>
    </toolbar-button>
    <toolbar-button
      v-show="activeGallery !== 'All'"
      @click="openModal('HomeModalDeleteAlbum'), passImgInfo(activeGallery)"
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
  <!-- </div> -->
</template>

<script>
import ToolbarButton from './BaseButtonImageToolbar';
import BaseDropMenu from './BaseDropMenu';
import { useStore } from 'vuex';
import { ref, reactive, computed, onMounted, nextTick } from 'vue';

export default {
  name: 'HomeActionsBarAlbumTabs',
  components: {
    ToolbarButton
    // BaseDropMenu
  },
  inject: ['setActiveGallery', 'openModal', 'passImgInfo'],
  props: {
    albums: {
      type: Array,
      default: () => []
    },
    activeGallery: { type: String, default: 'All' },
    userType: { type: String, default: '' }
  },
  setup(props) {
    const store = useStore();
    // window.addEventListener('resize', resizeHandler);

    const albumTabs = ref(null); // DOM el reference
    const overflowMenu = ref(null); // DOM el reference
    const { albums } = reactive(props);
    const displayedTabs = ref(null);
    displayedTabs.value = albums;
    const collapsedTabs = ref([]);
    const isOverflowing = ref(null);

    // onMounted(() => collapseTabs());

    let previousAlbumTabsWidth = null;

    function resizeHandler() {
      if (previousAlbumTabsWidth > albumTabs.value.offsetWidth) {
        collapseTabs();
      } else if (previousAlbumTabsWidth < albumTabs.value.offsetWidth) {
        expandTabs();
      }
      previousAlbumTabsWidth = albumTabs.value.offsetWidth;
    }

    const tabWidths = [];

    function checkIfOverflowing() {
      let displayedTabsWidth = 0;
      albumTabs.value.children.forEach(child => {
        if (isOverflowing.value === null) {
          tabWidths.push({
            albumName: child.innerText,
            width: child.offsetWidth
          });
        }
        displayedTabsWidth += child.offsetWidth;
      });
      isOverflowing.value = displayedTabsWidth > albumTabs.value.offsetWidth;
      return displayedTabsWidth;
    }

    async function collapseTabs() {
      if (!albumTabs.value) return;

      // First  determine if tabs are overflowing
      checkIfOverflowing();
      if (!isOverflowing.value) return;
      if (displayedTabs.value.length === 0) return;

      // If tabs overflowing, push last tab to collapsedTabs and pop from displayedTabs
      const lastTab = displayedTabs.value.pop();
      collapsedTabs.value.push({
        ...lastTab,
        width: tabWidths.find(x => x.albumName === lastTab.albumName).width
      });

      isOverflowing.value = false;

      await nextTick();
      // Calculate if overflowing again
      collapseTabs();
    }

    async function expandTabs() {
      if (!collapsedTabs.value.length) return;

      // See if adding any collapsed tabs would fit
      const lastTab = collapsedTabs.value[collapsedTabs.value.length - 1];
      const overflowMenuWidth =
        collapsedTabs.value.length === 1 ? overflowMenu.value.offsetWidth : 0;
      if (
        checkIfOverflowing() + lastTab.width - overflowMenuWidth <
        albumTabs.value.offsetWidth
      ) {
        // If tabs overflowing, push last tab to collapsedTabs and pop from displayedTabs
        displayedTabs.value.push(collapsedTabs.value.pop());

        await nextTick();

        expandTabs();
      }
    }

    return {
      albumTabs,
      overflowMenu,
      displayedTabs,
      collapsedTabs,
      isOverflowing
    };
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
