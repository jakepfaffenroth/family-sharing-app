<template>
  <base-menu>
    <template #subheading>
      You are a guest of {{ owner.firstName }} {{ owner.lastName }}
    </template>
    <template #buttons>
      <base-button-purple class="w-48 rounded-lg" @click="openSubscribeForm">
        Subscribe to updates
      </base-button-purple>

      <home-menu-image-sorter />
    </template>
  </base-menu>

  <home-modal-guest-subscribe
    v-show="isFormVisible"
    :owner="owner"
    @toggle-form="isFormVisible = !isFormVisible"
  ></home-modal-guest-subscribe>
</template>

<script>
import axios from 'axios';
import BaseMenu from './BaseMenu';
import BaseButtonPurple from './BaseButtonPurple';
import BaseModal from './BaseModal';
import BaseColorfulLogo from './BaseColorfulLogo';
import HomeMenuImageSorter from './HomeMenuImageSorter';
import HomeModalGuestSubscribe from './HomeModalGuestSubscribe';

export default {
  components: {
    BaseMenu,
    BaseButtonPurple,
    HomeMenuImageSorter,
    HomeModalGuestSubscribe
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
