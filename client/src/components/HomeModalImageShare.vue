<template>
  <base-modal @close-modal="closeModal">
    <template #header>
      <h3>
        Who to share with?
      </h3>
    </template>
    <template #content>
      <p class="mb-2 ">
        Choose the guest.
      </p>
      <div v-for="(subscriber, index) in subscribers" :key="index">
        <p>{{ `${subscriber.firstName} ${subscriber.lastName}` }}</p>
      </div>
      <!-- <p
        id="shareUrl"
        data-test="shareUrl"
        class="w-full text-sm text-gray-100 font-light tracking-wide bg-transparent outline-none"
      >
        {{ shareUrl }}
      </p> -->
    </template>
    <template #footer>
      <base-button-cancel @click="closeModal">
        Cancel
      </base-button-cancel>
      <base-button-purple @click="sendNotification">
        Send
      </base-button-purple>
    </template>
  </base-modal>
</template>

<script>
import BaseModal from './BaseModal';
import BaseButtonPurple from './BaseButtonPurple';
import BaseButtonCancel from './BaseButtonCancel';

import { computed, inject } from 'vue';
import { useStore } from 'vuex';

export default {
  name: 'ShareImageModal',
  components: { BaseModal, BaseButtonPurple, BaseButtonCancel },
  props: {
    imgInfo: { type: Object, default: null }
  },
  emits: ['close-modal'],
  setup(props, { emit }) {
    const store = useStore();
    const server = process.env.VUE_APP_SERVER;
    const toast = inject('toast');
    const owner = computed(() => store.getters.owner);
    store.dispatch('getSubscribers');
    const subscribers = computed(() => store.state.ownerStore.subscribers);

    function closeModal() {
      emit('close-modal');
    }

    async function sendNotification() {toast.success()}

    return { subscribers, closeModal, sendNotification };
  }
};
</script>

<style scoped>
.copied {
  @apply bg-teal-600 hover:bg-teal-500;
}
</style>
