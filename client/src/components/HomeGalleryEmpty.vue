<template>
  <div
    class="uppy-select-files flex flex-grow w-full bg-white rounded border-4 border-dashed border-gray-400 text-gray-500 hover:bg-gray-200 hover:text-gray-600 cursor-pointer transition-all duration-200 ease-in-out"
  >
    <p class="flex-grow self-center text-center text-2xl">
      <slot name="emptyGalleryText">
        Upload some images!
      </slot>
    </p>
  </div>
</template>
<script>
export default {
  emits: ['reload-uppy'],
  mounted() {
    this.$emit('reload-uppy');
  }
};
</script>
