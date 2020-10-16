<template>
  <transition name="slide-fade">
    <div
      class="fixed inset-0 flex items-end sm:items-center sm:justify-center bg-black bg-opacity-50"
      @click.self="$emit('close-modal')"
      @keydown.escape="$emit('close-modal')"
    >
      <div
        id="modal"
        class="w-full px-6 py-4 overflow-hidden bg-white rounded-t-lg shadow-lg dark:bg-gray-800 sm:rounded-lg sm:m-4 sm:max-w-xl z-50"
      >
        <div class="mb-4 text-white text-xl font-bold">
          <slot name="header"></slot>
        </div>
        <div class="text-white">
          <slot name="content"></slot>
        </div>
        <div
          class="flex flex-col items-center justify-end px-6 py-3 -mx-6 -mb-4 space-y-4 sm:space-y-0 sm:space-x-6 sm:flex-row"
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
