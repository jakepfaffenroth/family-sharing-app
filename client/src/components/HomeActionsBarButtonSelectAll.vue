<template>
  <button
    data-test="selectToolsSelectAll"
    :data-btn_action="selectedImages.length > 0 ? 'clear' : 'select'"
    class="menu-item-sm"
    :class="{ 'text-teal-600': selectedImages.length > 0 }"
    @click="toggleSelectAllBtn"
  >
    <!-- @click="test" -->
    <svg
      class="menu-icon"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M5 13l4 4L19 7"
      />
    </svg>
    {{ selectedImages.length > 0 ? 'Clear selection' : 'Select all' }}
    <!-- <span v-if="selectedImages.length > 0">
      Clear
      <span class="xhidden sm:inline-block">selection</span>
    </span>
    <span class="inline-block" v-else>Select all</span> -->
  </button>
</template>

<script>
export default {
  inject: ['toggleSelectAll'],
  props: {
    selectedImages: { type: Array, default: () => [] },
    closeMenu: {
      type: Function,
      default: () => {
        console.log('?');
      }
    }
  },
  methods: {
    toggleSelectAllBtn() {
      this.toggleSelectAll();
      if (this.selectedImages.length > 0) {
        console.log('this.selectedImages.length:', this.selectedImages.length);
        console.log('this.closeMenu:', this.closeMenu);
        this.closeMenu();
      }
    }
  }
};
</script>
