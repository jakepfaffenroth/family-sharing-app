<template>
  <base-modal @close-modal="closeModal">
    <template #header>
      <h3>
        Your unique sharing link
      </h3>
    </template>
    <template #content>
      <p class="mb-2 ">
        Share this link with family and friends.
      </p>
      <p
        id="shareUrl"
        data-test="shareUrl"
        class="w-full text-sm text-gray-100 font-light tracking-wide bg-transparent outline-none"
      >
        {{ shareUrl }}
      </p>
    </template>
    <template #footer>
      <base-button-cancel @click="closeModal">
        Cancel
      </base-button-cancel>
      <base-button-purple
        data-test="copyBtn"
        :class="btnColor"
        @click="copyShareUrl"
      >
        {{ copyBtnTxt }}
      </base-button-purple>
    </template>
  </base-modal>
</template>

<script>
import BaseModal from './BaseModal';
import BaseButtonPurple from './BaseButtonPurple';
import BaseButtonCancel from './BaseButtonCancel';

export default {
  name: 'ShareModal',
  components: { BaseModal, BaseButtonPurple, BaseButtonCancel },
  props: {
    imgInfo: { type: Object, default: null }
  },
  emits: ['close-modal'],
  data() {
    return {
      server: process.env.VUE_APP_SERVER,
      copyBtnTxt: 'Copy link',
      btnColor: null
    };
  },
  computed: {
    owner() {
      return this.$store.state.ownerStore.owner;
    },
    shareUrl() {
      return `${process.env.VUE_APP_SERVER}/${this.owner.guestId}/guest`;
    }
  },
  methods: {
    closeModal() {
      this.$emit('close-modal');
    },
    async copyShareUrl() {
      this.btnColor = 'copied';

      await navigator.clipboard.writeText(this.shareUrl);

      this.copyBtnTxt = 'Copied!';

      setTimeout(() => {
        this.copyBtnTxt = 'Copy link';
        this.btnColor = null;
      }, 10000);
    }
  }
};
</script>

<style scoped>
.copied {
  @apply bg-teal-600 hover:bg-teal-500;
}
</style>
