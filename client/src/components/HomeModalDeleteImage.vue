<template>
  <base-modal v-if="imgInfo" @close-modal="$emit('close-modal')">
    <template #header>
      <h3>
        Are you sure you want to delete
        {{ imgInfo.length > 1 ? imgInfo.length : 'this' }} image{{
          imgInfo.length > 1 ? 's' : ''
        }}?
      </h3>
    </template>
    <template #content>
      <p class="mb-6">
        It can't be undone!
      </p>
      <div class="relative flex h-56 p-4">
        <photo-stack
          :images-arr="imgInfo"
          :size="'big'"
          :click-enabled="false"
          class="h-48 w-56 sm:w-64 -mb-6 mt-6"
        ></photo-stack>
      </div>
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
import PhotoStack from './BasePhotoStack';
import BaseButtonPurple from './BaseButtonPurple';
import BaseButtonCancel from './BaseButtonCancel';

export default {
  components: {
    BaseModal,
    PhotoStack,
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

      const response = await axios.post(`${server}/files/delete-image`, {
        singleImage: true,
        images: [{ fileId, thumbFileId, fileName, ownerId }],
        ownerId
      });
      if (response.status == 200) {
        this.$store.dispatch('updateImages', response.data);
        this.$store.dispatch('getUsageData', {
          ownerId: this.$store.getters.ownerId
        });

        this.toast.open({
          type: 'success',
          duration: 3000,
          message: 'Image deleted'
        });
      } else {
        this.toast.open({
          type: 'error',
          duration: 3000,
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
