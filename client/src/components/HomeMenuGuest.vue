<template>
  <base-menu>
    <template #subheading>
      You are a guest of {{ owner.firstName }} {{ owner.lastName }}
    </template>
    <template #buttons>
      <base-button-purple
        class="w-auto rounded-lg"
        @click="$emit('open-modal', 'HomeModalGuestSubscribe')"
      >
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
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        Subscribe to updates
      </base-button-purple>
    </template>
  </base-menu>
</template>

<script>
import axios from 'axios';
import BaseMenu from './BaseMenu';
import BaseButtonPurple from './BaseButtonPurple';
import BaseModal from './BaseModal';
import BaseColorfulLogo from './BaseColorfulLogo';

export default {
  name: 'GuestMenu',
  components: {
    BaseMenu,
    BaseButtonPurple,
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

<style scoped>
.menu-icon {
  @apply inline-block -mt-0.5 w-4;
}
</style>
