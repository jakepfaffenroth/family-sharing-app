<template>
  <base-drop-menu>
    <template #button>
      <button
        data-test="imgMenuBtn"
        class="w-8 h-8 rounded-full hover:text-teal-500 hover:shadow-lg focus:ring"
      >
        <svg
          class="w-full h-full p-1 bg-gradient-to-r from-teal-400 to-purple-500 rounded-full shadow text-white"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"
          />
        </svg>
      </button>
    </template>
    <template #listItems>
      <div class="w-auto -m-1 whitespace-nowrap">
        <a
          data-test="shareSingleImgBtn"
          class="menu-item"
          @click.stop="shareImage()"
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
        </a>
        <a
          data-test="addToAlbumBtn"
          class="menu-item"
          @click.stop="openAlbumPicker()"
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
          Add to album
        </a>
        <a
          v-if="isAlbum"
          data-test="addToAlbumBtn"
          class="menu-item"
          @click.stop="removeFromAlbum()"
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
          Remove from album
        </a>
        <a
          data-test="imgDeleteBtn"
          class="menu-item"
          @click.stop="openDeleteModal()"
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
        </a>
      </div>
    </template>
  </base-drop-menu>
</template>

<script>
import axios from 'axios';
import { toRefs, computed, inject } from 'vue';
import { useStore } from 'vuex';

import BaseDropMenu from './BaseDropMenu';
export default {
  components: {
    BaseDropMenu
  },
  props: {
    item: { type: Object, default: () => {} },
    date: { type: String, default: () => {} },
    index: { type: Number, default: null },
    isAlbum: { type: Boolean, default: false }
  },
  setup(props, { emit }) {
    const store = useStore();
    const server = process.env.VUE_APP_SERVER;
    const toast = inject('toast');
    const openModal = inject('openModal');

    const ownerId = computed(() => store.getters.ownerId);
    const { item, date, index } = toRefs(props);
    const imgInfo = {
      ...item.value,
      date,
      ownerId: ownerId.value,
      index
    };
    const images = computed(() => store.getters.images);

    async function removeFromAlbum() {
      try {
        const response = await axios.post(server + '/albums/remove-image', {
          ownerId: ownerId.value,
          imgsToRemove: [
            {
              fileId: item.value.fileId,
              albumId: item.value.albumId,
              ownerId: ownerId.value
            }
          ]
        });
        if (response.status === 200) {
          toast.success('Image removed from album');
          store.dispatch('updateImages', response.data);
        } else toast.error('An error occurred');
      } catch (err) {
        console.error(err);
        toast.error('An error occurred');
      }
    }

    function openAlbumPicker() {
      openModal('HomeModalAlbumPicker', [imgInfo]);
    }

    function openDeleteModal() {
      openModal('HomeModalDeleteImage', imgInfo);
    }

    function shareImage() {
      openModal('HomeModalImageShare', imgInfo);
    }

    return {
      removeFromAlbum,
      openAlbumPicker,
      openDeleteModal,
      shareImage
    };
  }
};
</script>

<style scoped>
.menu-icon {
  @apply inline-block -mt-1 mr-1 w-4;
}

.menu-item {
  @apply block px-2 py-1 text-sm rounded cursor-pointer text-gray-800 hover:bg-teal-400 hover:text-white transition;
}
</style>
