<template>
  <transition appear name="slide-fade" mode="out-in">
    <div
      data-test="modalBackdrop"
      class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
      @click.self="$emit('close-modal')"
    >
      <div
        id="modal"
        data-test="modal"
        class="flex flex-col w-full max-w-2xl m-1 sm:m-10 px-4 py-3 sm:px-6 sm:py-4 rounded-lg shadow-lg bg-gray-800 z-50"
      >
        <div class="mb-4 text-white text-xl font-bold">
          <slot name="header"></slot>
        </div>
        <div class="flex-shrink mb-4 w-full text-white">
          <slot name="content"></slot>
        </div>
        <div
          class="flex px-0 flex-row-reverse justify-between sm:justify-start space-x-6"
        >
          <slot name="footer"></slot>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  emits: ['close-modal'],
  setup(props, { emit }) {
    window.addEventListener('keyup', function(event) {
      // ESC key
      if (event.key === 'Escape') {
        emit('close-modal');
      }
    });
  }
};
</script>
