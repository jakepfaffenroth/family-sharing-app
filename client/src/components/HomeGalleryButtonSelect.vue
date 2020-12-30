<template>
  <button
    data-test="imgSelectBtn"
    class="absolute right-1 w-8 h-8 rounded-full shadow overflow-hidden"
    :class="{ 'opacity-100': isSelectMode || isSelected }"
    @click.stop="toggleImgSelection"
  >
    <!-- Circle and colored background (when selected) -->
    <div
      :data-test-selected="isSelected ? 'true' : null"
      class="absolute top-0 w-full h-full border border-white rounded-full shadow"
      :class="{
        'opacity-100 bg-gradient-to-r from-teal-400 to-purple-500 rounded-full shadow text-white': isSelected
      }"
    ></div>
    <!-- checkmark -->
    <svg
      class="absolute top-0 w-full h-full text-white transition-all duration-150 ease-in-out rounded-full hover:shadow-lg"
      :class="{
        'opacity-0 hover:opacity-100': !isSelected
      }"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      viewBox="2 2 16 16"
    >
      <path
        shape-rendering="geometricPrecision"
        fill-rule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clip-rule="evenodd"
      />
    </svg>
  </button>
</template>

<script>
export default {
  name: 'SelectButton',
  props: {
    item: { type: Object, default: () => {} },
    group: { type: Object, default: () => {} },
    isSelectMode: { type: Boolean, default: false }
  },
  computed: {
    isSelected() {
      return this.$store.getters.selectedImages.find(
        x => x.fileId === this.item.fileId
      );
    }
  },
  methods: {
    toggleImgSelection() {
      if (!this.isSelected) {
        this.$store.dispatch('addToSelectedImages', this.item);
      } else if (this.isSelected) {
        this.$store.dispatch('removeFromSelectedImages', this.item);
      }
    }
  }
};
</script>
