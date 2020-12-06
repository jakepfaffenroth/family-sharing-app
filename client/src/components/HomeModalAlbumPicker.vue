<template>
  <base-modal @close-modal="closeModal">
    <template #header>
      <h3 data-test="albumPicker">
        Albums
      </h3>
    </template>
    <template #content>
      <div v-if="modalSwitch === 'addToAlbum'">
        <div>
          <label class="inline-flex items-center">
            <span class="mr-2">Add to a new album:</span>
            <input
              v-model="newAlbumName"
              class="px-1 py-0.5 rounded-md text-gray-800 placeholder-gray-500"
              type="text"
              name="newAlbumName"
              required
              placeholder="New album"
            />
            <button class="ml-4" @click="createNewAlbum">Create</button>
          </label>
        </div>
        <div v-if="albums.length">
          <div
            ref="albumList"
            class="h-56 mt-4 pt-2 flex flex-wrap overflow-y-auto"
          >
            <div
              v-for="(album, index) in albums"
              :id="album.albumName"
              :key="index"
              class="w-1/4 ml-0 mb-3"
            >
              <photo-stack
                :images-arr="album.images"
                @submit="submit(album)"
              ></photo-stack>
              <h4 class="w-full text-center font-thin text-sm">
                {{ album.albumName }}
              </h4>
            </div>
          </div>
          <svg
            v-if="isOverflowing"
            class="w-6 mx-auto animate-pulse"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
      <div v-if="modalSwitch === 'removeFromAlbum'">
        <p>
          {{
            `Are you sure you want to remove ${
              imgInfo.length > 1 ? imgInfo.length : 'this'
            } image${
              imgInfo.length > 1 ? 's' : ''
            } from the album ${activeGallery}?`
          }}
        </p>
        <p>No images will be deleted.</p>
        <div class="relative flex h-56 p-4">
          <photo-stack
            :images-arr="imgInfo"
            :stack-parent="'removeFromAlbum'"
            class="h-48 w-64 -mb-6 mt-6"
          ></photo-stack>
        </div>
      </div>
    </template>
    <template #footer>
      <base-button-cancel @click="closeModal">
        Cancel
      </base-button-cancel>
      <base-button-purple
        v-if="modalSwitch === 'removeFromAlbum'"
        data-test="confirmDeleteBtn"
        @click="submit(activeGallery)"
      >
        Remove
      </base-button-purple>
    </template>
  </base-modal>
</template>

<script>
import axios from 'axios';
import BaseModal from './BaseModal';
import BaseButtonCancel from './BaseButtonCancel';
import BaseButtonPurple from './BaseButtonPurple';
import PhotoStack from './BasePhotoStack';
import { addToAlbum, removeFromAlbum } from '../utils/editAlbumImages';
import { ref, reactive, computed, inject, onMounted } from 'vue';
import { useStore } from 'vuex';

export default {
  name: 'AlbumPickerModal',
  components: {
    BaseModal,
    BaseButtonCancel,
    BaseButtonPurple,
    PhotoStack
  },
  props: {
    imgInfo: { type: Object || Array, default: () => {} },
    activeGallery: { type: String, default: '' },
    modalSwitch: { type: String, default: 'addToAlbum' }
  },
  emits: ['close-modal'],
  setup(props, { emit }) {
    const store = useStore();
    const toast = inject('toast');
    const server = process.env.VUE_APP_SERVER;
    const images = computed(() => store.getters.images);
    const albums = computed(() =>
      store.getters.albums.filter(x => x.albumName !== 'All')
    );
    const ownerId = computed(() => store.getters.ownerId);

    const setActiveGallery = inject('setActiveGallery');

    const filteredImages = images.value.filter(x => {
      if (props.imgInfo.length > 2) {
        return false;
      }
      return x.albumId ? x.fileId === props.imgInfo[0].fileId : null;
    });

    let albumIds;
    if (filteredImages) {
      albumIds = filteredImages.map(x => {
        if (x.albumId) return x.albumId;
      });
    }

    const albumList = ref(null);
    const isOverflowing = computed(() => {
      if (!albumList.value) return;
      return albumList.value.offsetHeight < albumList.value.scrollHeight;
    });

    const newAlbumName = ref('');

    async function createNewAlbum() {
      if (albums.value.find(x => x.albumName === newAlbumName.value)) {
        toast.error('Albums must have unique names');
        return;
      }
      try {
        const response = await axios.post(server + '/albums/create-album', {
          name: newAlbumName.value,
          ownerId: ownerId.value
        });

        if (response.status === 200) {
          store.dispatch('addNewAlbum', response.data);
          toast.success('Album created');
          newAlbumName.value = '';
        } else {
          toast.error('An error occurred while creating the album');
        }
      } catch (err) {
        console.error(err);
      }
    }

    async function submit(album) {
      if (typeof album === 'string') {
        album = albums.value.find(x => x.albumName === props.activeGallery);
      }
      if (props.modalSwitch === 'addToAlbum') {
        await addToAlbum(props.imgInfo, album, ownerId.value, store);
        store.dispatch('replaceSelectedImages', []);
        closeModal();
      } else if (props.modalSwitch === 'removeFromAlbum') {
        await removeFromAlbum(props.imgInfo, album, ownerId.value, store);
        if (album.images.length === props.imgInfo.length) {
          // All images were removed; Go to All
          setActiveGallery('All');
        }
        store.dispatch('replaceSelectedImages', []);
        closeModal();
      } else return;
    }

    function closeModal() {
      emit('close-modal');
    }

    return {
      albums,
      newAlbumName,
      createNewAlbum,
      closeModal,
      submit,
      addToAlbum,
      removeFromAlbum,
      albumList,
      isOverflowing
    };
  }
};
</script>
