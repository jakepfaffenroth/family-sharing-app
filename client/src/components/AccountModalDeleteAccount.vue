<template>
  <base-modal @close-modal="$emit('close-modal')">
    <template #header>
      <h3>
        Are you sure you want to delete your account?
      </h3>
    </template>
    <template #content>
      <p class="mb-6">
        This
        <span class="font-bold text-purple-500">cannot</span>
        be undone. All personal data,
        <span class="font-bold text-purple-500">including images</span>
        , will be immediately and permanently deleted.
      </p>
      <div v-if="isAuth">
        <p>
          Please type
          <span class="font-bold text-teal-500 select-none">
            {{ ownerEmail }}
          </span>
          to confirm.
        </p>
        <input
          v-model="deletionText"
          type="text"
          class="w-full mt-2 mb-3 px-2 pt-1 pb-0.5 rounded text-gray-700 focus:ring"
          @input="checkInput"
        />
      </div>
      <p v-else>
        You must verify your email before your account can be deleted.
      </p>
    </template>
    <template #footer>
      <base-button-cancel @click.prevent="$emit('close-modal')">
        Cancel
      </base-button-cancel>
      <base-button-red
        data-test="confirmDeleteBtn"
        :class="{
          'disabled-button': checkInput() === false
        }"
        @click="deleteAndCloseModal"
      >
        Delete
      </base-button-red>
    </template>
  </base-modal>
</template>

<script>
import http from '../utils/http';
import BaseModal from './BaseModal';
import BaseButtonRed from './BaseButtonRed';
import BaseButtonCancel from './BaseButtonCancel';

export default {
  components: {
    BaseModal,
    BaseButtonRed,
    BaseButtonCancel
  },
  inject: ['toast'],
  emits: ['close-modal'],
  data() {
    return {
      deletionText: ''
    };
  },
  computed: {
    ownerEmail() {
      return this.$store.state.ownerStore.owner.email;
    },
    ownerId() {
      return this.$store.getters.ownerId;
    },
    isAuth() {
      return this.$store.getters.isAuth;
    }
  },
  methods: {
    checkInput() {
      return this.deletionText === this.ownerEmail;
    },

    async deleteAndCloseModal() {
      // TODO - POST ownerId to server - server nukes images and deletes any db row with ownerId
      this.toast.success('Account deleted');

      this.$emit('close-modal');

      const { data, status } = await http.post('/user/delete-account', {
        ownerId: this.ownerId
      });

      if (status >= 200 && status < 300) {
        this.$route.push(process.env.VUE_APP_SERVER);
      }
      // Delete individual images

      // const response = await http.post('/files/delete-image', {
      //   singleImage: true,
      //   images: [{ fileId, thumbFileId, fileName, ownerId }],
      //   ownerId
      // });
      // if (response.status == 200) {
      //   this.$store.dispatch('updateImages', response.data);
      //   this.$store.dispatch('getUsageData', {
      //     ownerId: this.$store.getters.ownerId
      //   });

      //   this.toast.open({
      //     type: 'success',
      //     duration: 3000,
      //     message: 'Image deleted'
      //   });
      // } else {
      //   this.toast.open({
      //     type: 'error',
      //     duration: 3000,
      //     message: 'Error deleting image'
      //   });
      //   console.log(
      //     `Deletion error: ${response.status} - ${response.statusText}`
      //   );
      // }
    }
  }
};
</script>

<style scoped>
.disabled-button {
  @apply pointer-events-none bg-gray-100 border-red-300 text-red-300;
}
</style>
