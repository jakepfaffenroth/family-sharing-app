<template>
  <div>
    <colorful-logo class="self-center sm:self-start" :content="'carousel'" />
    <h1
      class="text-lg tracking-tight leading-10 font-semibold text-gray-900 sm:text-lg sm:leading-none md:text-xl"
    >
      <!-- <span
      class="bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-orange-400 via-purple-400"
    > -->
      <span class="inline-block align-baseline text-gray-700 text">
        You are a guest of {{ owner.firstName }} {{ owner.lastName }}
      </span>
      <!-- </span> -->
    </h1>
  </div>
  <div class="flex flex-col items-center sm:items-end ml-auto py-4 mt-3">
    <button
      class="combo-btn self-end w-48 px-2  leading-5 text-white bg-purple-500  rounded-lg active:bg-purple-600 hover:bg-purple-600 focus:shadow-outline-purple"
      @click="openSubscribeForm"
    >
      Subscribe to updates
    </button>

    <image-sorter class="mt-2" />
  </div>

  <subscribe-modal
    v-show="isFormVisible"
    @toggle-form="isFormVisible = !isFormVisible"
    :owner="owner"
  ></subscribe-modal>
</template>

<script>
import axios from 'axios';
import Modal from './Modal';
import ColorfulLogo from './ColorfulLogo';
import ImageSorter from './ImageSorter';
import SubscribeModal from './SubscribeModal';

export default {
  components: {
    ColorfulLogo,
    ImageSorter,
    SubscribeModal
  },
  props: { owner: { type: Object, default: null } },
  data() {
    return {
      server: process.env.VUE_APP_SERVER,
      subOptions: { browser: null, email: null },
      guest: {
        firstName: null,
        lastName: null,
        email: null,
        guestId: this.owner.guestId
      },
      isFormVisible: false
    };
  },
  methods: {
    openSubscribeForm() {
      this.isFormVisible = true;
    }
  }
};
</script>

<style></style>
