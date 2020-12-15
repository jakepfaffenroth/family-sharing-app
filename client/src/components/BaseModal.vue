<template>
  <transition appear name="slide-fade" mode="out-in">
    <div
      data-test="modalBackdrop"
      class="fixed inset-0 flex items-center sm:justify-center bg-black bg-opacity-50 z-50"
      @click.self="$emit('close-modal')"
      @keydown.escape="$emit('close-modal')"
    >
      <div
        id="modal"
        data-test="modal"
        class="flex flex-col w-screen sm:h-screen md:h-auto md:w-full px-6 py-4 rounded-lg shadow-lg bg-gray-800 m-4 md:max-w-xl  z-50"
      >
        <div class="mb-4 text-white text-xl font-bold">
          <slot name="header"></slot>
        </div>
        <div class="flex-shrink mb-4 text-white">
          <slot name="content"></slot>
        </div>
        <div
          class="flex items-center justify-center sm:justify-end px-6 py-3 -mx-6 -mb-4 space-x-6"
        >
          <slot name="footer"></slot>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  emits: ['close-modal']
};
</script>
