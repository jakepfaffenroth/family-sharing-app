<template>
  <div
    x-show="isModalOpen"
    x-transition:enter="transition ease-out duration-150"
    x-transition:enter-start="opacity-0"
    x-transition:enter-end="opacity-100"
    x-transition:leave="transition ease-in duration-150"
    x-transition:leave-start="opacity-100"
    x-transition:leave-end="opacity-0"
    class="fixed inset-0 z-30 flex items-end bg-black bg-opacity-25 sm:items-center sm:justify-center"
    @click.self="closeModal"
  >
    <div
      id="modal"
      x-show="isModalOpen"
      x-transition:enter="transition ease-out duration-150"
      x-transition:enter-start="opacity-0 transform translate-y-1/2"
      x-transition:enter-end="opacity-100"
      x-transition:leave="transition ease-in duration-150"
      x-transition:leave-start="opacity-100"
      x-transition:leave-end="opacity-0  transform translate-y-1/2"
      class="w-full px-6 py-4 overflow-hidden bg-white rounded-t-lg shadow-lg dark:bg-gray-800 sm:rounded-lg sm:m-4 sm:max-w-xl"
      role="dialog"
      @keydown.escape="closeModal"
    >
      <slot>
        <!-- Remove header if you don't want a close icon. Use modal body to place modal tile. -->
        <!-- <header class="flex justify-end">
        <button
          class="inline-flex items-center justify-center w-6 h-6 text-gray-400 transition-colors duration-150 rounded dark:hover:text-gray-200 hover: hover:text-gray-700"
          aria-label="close"
          @click="closeModal"
        >
          <svg
            class="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 20 20"
            role="img"
            aria-hidden="true"
          >
            <path
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clip-rule="evenodd"
              fill-rule="evenodd"
            ></path>
          </svg>
        </button>
      </header> -->
        <!-- Modal body -->
        <div class="mt-2 mb-6">
          <!-- Modal title -->
          <p
            class="mb-4 text-lg font-semibold text-gray-700 dark:text-gray-300"
          >
            Your unique sharing link
          </p>
          <p
            class="my-2 w-full text-sm text-gray-700 dark:text-gray-300 bg-transparent outline-none"
          >
            Share this link with family and friends.
          </p>
          <!-- Modal description -->
          <textarea
            :id="shareUrl || singleImgUrl"
            class="w-full text-sm text-gray-700 dark:text-gray-300 bg-transparent outline-none resize-none"
            readonly="readonly"
            :value="shareUrl || singleImgUrl"
          ></textarea>
        </div>
        <footer
          class="flex flex-col items-center justify-end px-6 py-3 -mx-6 -mb-4 space-y-4 sm:space-y-0 sm:space-x-6 sm:flex-row bg-gray-50 dark:bg-gray-800"
        >
          <button
            class="btn text-gray-700 border-gray-300 dark:text-gray-400 sm:px-4  active:bg-transparent hover:border-gray-500 focus:border-gray-500 active:text-gray-500 focus:shadow-outline-gray"
            @click="closeModal"
          >
            Cancel
          </button>
          <button
            class="btn text-white border-transparent"
            :class="btnColor"
            @click="copyShareUrl"
          >
            {{ copyBtnTxt }}
          </button>
        </footer>
      </slot>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    shareUrl: { type: String, default: null },
    singleImgUrl: { type: String, default: null }
  },
  emits: ['close-modal'],
  data() {
    return {
      copyBtnTxt: 'Copy link',
      btnColor:
        'bg-purple-600 active:bg-purple-600 hover:bg-purple-700  focus:shadow-outline-purple'
    };
  },
  methods: {
    closeModal() {
      this.$emit('close-modal');
    },
    copyShareUrl() {
      const changeBtnColor = (from, to) => {
        this.btnColor = this.btnColor.replaceAll(from, to);
      };

      /* Get the text field */
      const copyText = document.getElementById(
        this.shareUrl || this.singleImgUrl
      );
      console.log('copyText:', copyText);
      /* Select the text field */
      copyText.select();
      copyText.setSelectionRange(0, 99999); /*For mobile devices*/

      /* Copy the text inside the text field */
      document.execCommand('copy');
      copyText.selectionEnd = copyText.selectionStart;

      changeBtnColor('purple', 'teal');
      this.copyBtnTxt = 'Copied!';

      setTimeout(() => {
        this.copyBtnTxt = 'Copy link';
        changeBtnColor('teal', 'purple');
      }, 10000);
    }
  }
};
</script>

<style scoped>
.btn {
  @apply w-full px-5 py-3 text-sm font-medium leading-5 transition-colors duration-150 ease-in-out border rounded-lg sm:w-24 sm:px-4 sm:py-2 focus:outline-none;
}
</style>
