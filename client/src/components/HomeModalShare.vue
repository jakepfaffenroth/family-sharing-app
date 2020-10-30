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
      <textarea
        :id="shareUrl || singleImgUrl"
        class="w-full text-sm  bg-transparent outline-none resize-none"
        readonly="readonly"
        :value="shareUrl || singleImgUrl"
      ></textarea>
    </template>
    <template #footer>
      <base-button-cancel @click="closeModal">
        Cancel
      </base-button-cancel>
      <base-button-purple :class="btnColor" @click="copyShareUrl">
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
    // owner: {type:Object, default:null},
    // shareUrl: { type: String, default: null },
    imgInfo: { type: Object, default: null }
  },
  emits: ['close-modal'],
  data() {
    return {
      copyBtnTxt: 'Copy link',
      btnColor: null
    };
  },
  computed:{
    owner(){return this.$store.state.ownerStore.owner},
    shareUrl(){return `${process.env.VUE_APP_SERVER}/${this.owner.guestId}/guest`}
  },
  methods: {
    closeModal() {
      this.$emit('close-modal');
    },
    copyShareUrl() {
      this.btnColor = 'copied';

      /* Get the text field */
      const copyText = document.getElementById(
        this.shareUrl || this.singleImgUrl
      );
      /* Select the text field */
      copyText.select();
      copyText.setSelectionRange(0, 99999); /*For mobile devices*/

      /* Copy the text inside the text field */
      document.execCommand('copy');
      copyText.selectionEnd = copyText.selectionStart;

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
