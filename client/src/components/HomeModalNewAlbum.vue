<template>
  <base-modal @close-modal="closeModal">
    <template #header>
      <h3>
        Create a new album
      </h3>
    </template>
    <template #content>
      <label class="inline-flex items-center">
        <span class="mr-2">Album Name:</span>
        <input
          v-model="newAlbumName"
          class="px-1 py-0.5 rounded-md text-gray-800"
          type="text"
          name="newAlbumName"
          required
          placeholder="New album"
        />
      </label>
    </template>
    <template #footer>
      <base-button-cancel @click="closeModal">
        Cancel
      </base-button-cancel>
      <base-button-purple @click="saveAlbum">
        Save
      </base-button-purple>
    </template>
  </base-modal>
</template>

<script>
import axios from 'axios';
import { useStore } from 'vuex';
import { ref, computed, inject } from 'vue';
import BaseModal from './BaseModal';
import BaseButtonPurple from './BaseButtonPurple';
import BaseButtonCancel from './BaseButtonCancel';

export default {
  name: 'AddAlbumModal',
  components: { BaseModal, BaseButtonPurple, BaseButtonCancel },
  emits: ['close-modal'],
  setup(props, { emit }) {
    const store = useStore();
    const server = process.env.VUE_APP_SERVER;
    const toast = inject('toast');
    const setActiveGallery = inject('setActiveGallery');
    let newAlbumName = ref('');

    const ownerId = computed(() => store.getters.ownerId);
    const albums = computed(() => store.getters.albums);

    async function saveAlbum() {
      // const response = await createNewAlbum(
      //   { name: newAlbumName.value, ownerId: ownerId.value },
      //   albums.value
      // );

      // if (!response) {
      //   toast.error('Albums must have unique names');
      //   return;
      // }

      // if (response.status === 200) {
      //   store.dispatch('addNewAlbum', response.data);
      //   setActiveGallery(newAlbumName.value);
      //   closeModal();
      //   toast.success('Album created');
      // } else {
      //   toast.error('An error occurred while creating the album');
      // }
      if (albums.value.find(x => x.albumName === newAlbumName.value)) {
        toast.error('Albums must have unique names');
        return;
      }
      try {
        const {status, data} = await axios.post(server + '/albums/create-album', {
          name: newAlbumName.value,
          ownerId: ownerId.value
        });

        if (status >= 200 && status < 300) {
          store.dispatch('addNewAlbum', data);
          setActiveGallery(newAlbumName.value);
          closeModal();
          toast.success('Album created');
        } else {
          toast.error('An error occurred while creating the album');
        }
      } catch (err) {
        console.error(err);
      }
    }

    function closeModal() {
      emit('close-modal');
    }

    return {
      newAlbumName,
      saveAlbum,
      closeModal
    };
  }
};
</script>

<style scoped></style>
