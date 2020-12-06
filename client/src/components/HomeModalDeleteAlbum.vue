<template>
  <base-modal @close-modal="closeModal">
    <template #header>
      <h3>
        {{ `Delete the album '${album.albumName}'` }}
      </h3>
    </template>
    <template #content>
      <p>Are you sure you want to delete this album?</p>
      <p>No photos will be deleted.</p>
    </template>
    <template #footer>
      <base-button-cancel @click="closeModal">
        Cancel
      </base-button-cancel>
      <base-button-purple @click="deleteAlbum">
        Delete
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
  props: {
    activeGallery: { type: String, default: '' }
  },
  emits: ['close-modal'],
  setup(props, { emit }) {
    const store = useStore();
    const server = process.env.VUE_APP_SERVER;
    const toast = inject('toast');
    const setActiveGallery = inject('setActiveGallery');
    const album = computed(() =>
      albums.value.find(x => x.albumName === props.activeGallery)
    );

    const ownerId = computed(() => store.getters.ownerId);
    const albums = computed(() => store.getters.albums);

    async function deleteAlbum() {
      if (!album.value) {
        toast.error('An error occurred');
        return;
      }
      try {
        const response = await axios.post(
          server + '/albums/delete-album',
          album.value
        );

        if (response.status === 200) {
          setActiveGallery('All');
          store.dispatch('removeAlbum', response.data);
          closeModal();
          toast.success('Album deleted');
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
      album,
      deleteAlbum,
      closeModal
    };
  }
};
</script>

<style scoped></style>
