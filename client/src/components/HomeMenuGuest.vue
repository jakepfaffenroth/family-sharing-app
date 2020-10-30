<template>
  <base-menu>
    <template #subheading>
      You are a guest of {{ owner.firstName }} {{ owner.lastName }}
    </template>
    <template #buttons>
      <base-button-purple
        class="w-48 rounded-lg"
        @click="$emit('open-modal', 'HomeModalGuestSubscribe')"
      >
        Subscribe to updates
      </base-button-purple>

      <home-menu-image-sorter />
    </template>
  </base-menu>
</template>

<script>
import axios from 'axios';
import BaseMenu from './BaseMenu';
import BaseButtonPurple from './BaseButtonPurple';
import BaseModal from './BaseModal';
import BaseColorfulLogo from './BaseColorfulLogo';
import HomeMenuImageSorter from './HomeMenuImageSorter';

export default {
  name: 'GuestMenu',
  components: {
    BaseMenu,
    BaseButtonPurple,
    HomeMenuImageSorter
  },
  emits: ['open-modal'],
  computed: {
    owner() {
      return this.$store.state.ownerStore.owner;
    },
    guestId() {
      return this.owner.guestId;
    }
  }
};
</script>
