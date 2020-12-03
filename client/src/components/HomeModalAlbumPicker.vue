<template>
  <base-modal @close-modal="closeModal">
    <template #header>
      <h3 data-test="albumPicker">
        Albums
      </h3>
    </template>
    <template #content>
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
          <button @click="createNewAlbum">Create</button>
        </label>
      </div>
      <div v-if="albums.length">
        <div ref="albumList" class="h-56 mt-4 flex flex-wrap overflow-y-auto">
          <div
            v-for="(album, index) in albums"
            :key="index"
            class="flex w-1/2 mb-2 p-1 rounded transition cursor-pointer hover:bg-gray-700 hover:shadow"
            @click="save(album)"
          >
            <img
              class="w-24 h-24 object-cover bg-gray-300 rounded"
              :src="album.images[0] ? album.images[0].thumbnail : ''"
            />
            <div class="ml-4">
              <h4 class="font-thin">
                {{ album.albumName }}
              </h4>
            </div>
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
    </template>
    <template #footer>
      <base-button-cancel @click="closeModal">
        Cancel
      </base-button-cancel>
    </template>
  </base-modal>
</template>

<script>
import axios from 'axios';
import BaseModal from './BaseModal';
import BaseButtonCancel from './BaseButtonCancel';
import { ref, reactive, computed, inject, onMounted } from 'vue';
import { useStore } from 'vuex';

export default {
  name: 'AlbumPickerModal',
  components: {
    BaseModal,
    BaseButtonCancel
  },
  props: {
    imgInfo: { type: Object || Array, default: () => {} }
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

    async function save(album) {
      if (props.imgInfo.length > 0 || props.imgInfo) {
        let imgAlbumPairs = [];
        props.imgInfo.forEach(img => {
          imgAlbumPairs.push({
            file_id: img.fileId,
            album_id: album.albumId,
            owner_id: ownerId.value
          });
        });
        // Send array of fileIds and albumIds to server to be added to DB
        try {
          const response = await axios.post(
            process.env.VUE_APP_SERVER + '/albums/add-image',
            {
              ownerId: store.getters.ownerId,
              imgAlbumPairs
            }
          );

          if (response.status === 200 && response.data.length === 0) {
            toast.open({
              type: 'info',
              duration: 3000,
              dismissible: true,
              message: 'Image is already in that album'
            });
          } else if (response.status === 200) {
            store.dispatch('updateImages', response.data);
            toast.success(
              `Image${props.imgInfo.length ? 's' : ''} added to album${
                imgAlbumPairs.length > 1 ? 's' : ''
              }`
            );
          } else throw Error('An error occured');
        } catch (err) {
          console.error(err);
        }
      } else {
        console.error('oops');
      }
      closeModal();
    }

    function closeModal() {
      emit('close-modal');
    }

    return {
      albums,
      newAlbumName,
      createNewAlbum,
      closeModal,
      save,
      albumList,
      isOverflowing
    };
  }
};
</script>

<style scoped></style>
