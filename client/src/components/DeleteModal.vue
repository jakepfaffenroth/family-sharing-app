<template>
  <transition name="slide-fade">
    <modal @close-modal="$emit('toggle-form')">
      <div class="text-white">
        <h3 class="text-xl">Are you sure you want to delete this image?</h3>
        <div class="font-light mt-2">
          <p>It cannot be undone.</p>
          <button
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-teal-600 hover:bg-teal-500 focus:outline-none focus:border-teal-700 focus:shadow-outline-teal active:bg-teal-700 transition duration-150 ease-in-out"
            @click.prevent="$emit('toggle-form')"
          >
            Cancel
          </button>
          <button
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-teal-600 hover:bg-teal-500 focus:outline-none focus:border-teal-700 focus:shadow-outline-teal active:bg-teal-700 transition duration-150 ease-in-out"
            @click="deleteAndCloseModal"
          >
            Delete
          </button>
        </div>
      </div>
    </modal>
  </transition>
</template>

<script>
import Modal from './Modal';

export default {
  props: {
    imgDeleteInfo: {
      type: Object,
      default: null
    }
  },
  components: {
    Modal
  },
  methods: {
    deleteAndCloseModal() {
      this.$emit('delete-image', this.imgDeleteInfo);
      this.$emit('toggle-form');
    }
  }
};
</script>

<style scoped></style>
