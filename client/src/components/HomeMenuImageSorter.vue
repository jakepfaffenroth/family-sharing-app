<template>
  <div
    class="flex justify-end content-center mt-2 divide-x divide-gray-600 text-gray-700"
  >
    <base-drop-menu menu-type="sortMenu">
      <template #btnLabel>
        Sort
      </template>
      <template #listItems>
        <a
          class="img-menu-link"
          @click="sortImages('captureTime'), closeMenu()"
        >
          Capture time
        </a>
        <a class="img-menu-link" @click="sortImages('uploadTime'), closeMenu()">
          Date uploaded
        </a>
      </template>
    </base-drop-menu>

    <button
      class="px-2 mt-0.5 hover:text-teal-500 focus:outline-none"
      @click="sortImages('reverse'), (sortAsc = !sortAsc)"
    >
      <svg
        v-if="sortAsc"
        class="m-auto h-4 w-4"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h5a1 1 0 000-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM13 16a1 1 0 102 0v-5.586l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 101.414 1.414L13 10.414V16z"
        />
      </svg>
      <svg
        v-if="!sortAsc"
        class="m-auto h-4 w-4"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h7a1 1 0 100-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z"
        />
      </svg>
    </button>
  </div>
</template>

<script>
import BaseDropMenu from './BaseDropMenu';

export default {
  components: {
    BaseDropMenu
  },
  // emits: ['sort-images'],
  inject: ['sortImages'],
  data() {
    return {
      isMenuVisible: false,
      sortAsc: true
    };
  },
  methods: {
    closeMenu() {
      this.isMenuVisible = false;
    }
  }
};
</script>

<style scoped></style>
