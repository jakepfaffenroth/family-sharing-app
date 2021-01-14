<template>
  <transition name="album" appear mode="out-in">
    <div
      v-show="showBanner"
      class="flex flex-wrap justify-between px-2 sm:px-4 md:px-6 xl:px-8 py-2 bg-blue-600 shadow z-50 whitespace-nowrap"
      :class="showBanner ? 'h-auto' : 'h-0'"
    >
      <label class="flex mx-auto my-2 text-white font-semibold">
        <slot name="text"></slot>
      </label>
      <button
        v-if="showButton"
        class="flex mx-auto px-2 my-2 border rounded-sm text-white text-sm hover:bg-white hover:text-blue-600 transition"
        @click="btnAction"
      >
        <slot name="button"></slot>
      </button>
    </div>
  </transition>
</template>

<script>
export default {
  props: {
    showBanner: { type: Boolean, default: false },
    showButton: { type: Boolean, default: true },
    btnAction: { type: Function, default: () => {} }
  }
};
</script>

<style scoped></style>
