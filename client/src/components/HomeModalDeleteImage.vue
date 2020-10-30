<template>
  <base-modal v-if="imgInfo" @close-modal="$emit('close-modal')">
    <template #header>
      <h3>
        Are you sure you want to delete this image?
      </h3>
    </template>
    <template #content>
      <p class="mb-6">
        It can't be undone!
      </p>
      <img class="mb-10 h-56 rounded shadow" :src="imgInfo.thumb" />
    </template>
    <template #footer>
      <base-button-cancel @click.prevent="$emit('close-modal')">
        Cancel
      </base-button-cancel>
      <base-button-purple
        data-test="confirmDeleteBtn"
        @click="deleteAndCloseModal"
      >
        Delete
      </base-button-purple>
    </template>
  </base-modal>
</template>

<script>
import axios from 'axios';
import BaseModal from './BaseModal';
import BaseButtonPurple from './BaseButtonPurple';
import BaseButtonCancel from './BaseButtonCancel';

export default {
  components: {
    BaseModal,
    BaseButtonPurple,
    BaseButtonCancel
  },
  inject: ['toast'],
  props: {
    imgInfo: {
      type: Object,
      default: null
    }
  },
  emits: ['close-modal'],
  methods: {
    async deleteAndCloseModal() {
      // this.$emit('delete-image', this.imgInfo);
      this.$emit('close-modal');
      const server = process.env.VUE_APP_SERVER;
      // Delete individual images
      const {
        date,
        fileId,
        thumbFileId,
        fileName,
        ownerId,
        index
      } = this.imgInfo;
      // force Uppy to reload if there are zero images
      // if (images.value.length === 0) {
      //   forceReloadKey.value++;
      // }
      const response = await axios.post(`${server}/files/delete-image`, {
        singleImage: true,
        fileId,
        thumbFileId,
        fileName,
        ownerId
      });
      if (response.status == 200) {
        this.toast.open({
          type: 'success',
          duration: 3000,
          // dismissible: true,
          message: 'Image deleted'
        });
        
        this.$store.dispatch('removeFromImages', this.imgInfo);
        this.$store.dispatch('getUsageData', {
          ownerId: this.$store.getters.ownerId
        });
      } else {
        this.toast.open({
          type: 'error',
          duration: 3000,
          // dismissible: true,
          message: 'Error deleting image'
        });
        console.log(
          `Deletion error: ${response.status} - ${response.statusText}`
        );
      }
    }
  }
};
</script>
