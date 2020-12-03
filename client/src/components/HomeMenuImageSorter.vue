<template>
  <div
    class="flex divide-x divide-gray-600 text-gray-700 transition duration-150 ease-in-out"
  >
    <base-drop-menu>
      <template #button>
        <p
          class="p-2 pb-1 hover:text-teal-500 focus:outline-none cursor-pointer"
        >
          Sort
        </p>
      </template>
      <template #listItems>
        <div class="w-32 p-2 pb-1">
          <a class="menu-item" @click="sortImages('captureTime'), closeMenu()">
            Capture time
          </a>
          <a class="menu-item" @click="sortImages('uploadTime'), closeMenu()">
            Date uploaded
          </a>
        </div>
      </template>
    </base-drop-menu>

    <button
      v-if="ENABLE_REVERSE"
      class="mt-0.5 pl-2 hover:text-teal-500 focus:outline-none transition duration-150 ease-in-out"
      @click="sortImages('reverse'), (sortAsc = !sortAsc)"
    >
      <svg class="m-auto h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <!-- Version for sort:ascending -->
        <path
          v-if="sortAsc"
          d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h5a1 1 0 000-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM13 16a1 1 0 102 0v-5.586l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 101.414 1.414L13 10.414V16z"
        />
        <!-- Version for sort:descending -->
        <path
          v-else
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
  inject: ['sortImages'], // Provided in Home
  data() {
    return {
      isMenuVisible: false,
      sortAsc: true,
      ENABLE_REVERSE: false
    };
  },
  methods: {
    closeMenu() {
      this.isMenuVisible = false;
    }
  }
};
</script>

<style scoped>
.menu-item {
  @apply block px-2 py-1 text-sm rounded cursor-pointer text-gray-800 hover:bg-teal-400 hover:text-white;
}
</style>
