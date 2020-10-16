<template>
  <base-modal @close-modal="$emit('close-delete-modal')">
    <template #header>
      <h3>
        Are you sure you want to delete this image?
      </h3>
    </template>
    <template #content>
      <p class="mb-10">
        It can't be undone!
      </p>
    </template>
    <template #footer>
      <base-button-cancel @click.prevent="$emit('close-delete-modal')">
        Cancel
      </base-button-cancel>
      <base-button-purple @click="deleteAndCloseModal">
        Delete
      </base-button-purple>
    </template>
  </base-modal>
</template>

<script>
import BaseModal from './BaseModal';
import BaseButtonPurple from './BaseButtonPurple';
import BaseButtonCancel from './BaseButtonCancel';

export default {
  components: {
    BaseModal,
    BaseButtonPurple,
    BaseButtonCancel
  },
  props: {
    imgDeleteInfo: {
      type: Object,
      default: null
    }
  },
  emits: ['close-delete-modal', 'delete-image'],
  methods: {
    deleteAndCloseModal() {
      this.$emit('delete-image', this.imgDeleteInfo);
      this.$emit('close-delete-modal');
    }
  }
};
</script>

<style scoped></style>
