<template>
  <div class="flex ml-0.5 space-x-2 sm:space-x-8 text-base sm:text-sm">
    <!-- Non-mobile Album Tools -->
    <!-- <div class="hiddenX md:block"> -->
    <toolbar-button
      v-if="activeGallery !== 'All'"
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
      <span class="smX:hidden md:inline-block">Album</span>
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
      <span class="smX:hidden lg:inline-block">Album</span>
    </toolbar-button>
    <!-- </div> -->

    <!-- DISABLED -->
    <!-- Mobile album tools -->
    <div class="hidden md:hidden">
      <toolbar-button
        v-if="activeGallery === 'All' && ENABLED"
        class="pl-0"
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
        New Album
      </toolbar-button>

      <!-- Menu-less album tools -->
      <div>
        <toolbar-button
          v-show="activeGallery !== 'All'"
          class="pl-0"
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
          <span>Album</span>
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

      <mobile-drop-menu
        v-if="activeGallery !== 'All' && ENABLED"
        :position="'center'"
      >
        <template #button>
          <toolbar-button class="flex font-lg font-bold my-auto pl-0">
            Actions
            <span>
              <svg
                class="w-4 mt-0.5 ml-0.5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
            </span>
          </toolbar-button>
        </template>
        <template #listItems>
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
            <span class=" md:inline-block">to Album</span>
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
        </template>
      </mobile-drop-menu>
    </div>
  </div>
</template>

<script>
import MobileDropMenu from './BaseDropMobile';
import ToolbarButton from './BaseButtonImageToolbar';
import { useStore } from 'vuex';
import { ref, reactive, computed, onMounted, nextTick } from 'vue';

export default {
  name: 'HomeActionsBarAlbumTools',
  components: {
    MobileDropMenu,
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
  @apply inline-block w-4 mb-0.5 mr-0 sm:ml-0.5;
}

.menu-item {
  @apply block w-full px-2 py-1 text-sm rounded cursor-pointer text-gray-800 hover:bg-teal-400 hover:text-white transition;
}
</style>
