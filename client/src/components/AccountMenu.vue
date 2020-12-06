<template>
  <base-menu>
    <template #subheading>
      Account: {{ owner.firstName }} {{ owner.lastName }}
    </template>
    <template #buttons>
      <router-link
        to="/"
        class="flex items-center space-x-2 border border-transparent transition-colors duration-150 focus:outline-none self-center px-5 py-1 font-medium leading-5 text-white bg-purple-500 rounded-lg shadow active:bg-purple-600 hover:bg-purple-600 focus:ring-purple cursor-pointer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-4 h-4"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
            clip-rule="evenodd"
          />
        </svg>
        <span>Back to Gallery</span>
      </router-link>
    </template>
  </base-menu>
</template>

<script>
import BaseMenu from './BaseMenu';

export default {
  components: { BaseMenu },
  computed: {
    owner() {
      return this.$store.state.ownerStore.owner;
    }
  }
};
</script>
