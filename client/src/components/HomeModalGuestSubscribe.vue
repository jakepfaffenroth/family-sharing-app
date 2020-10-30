<template>
  <transition name="slide-fade">
    <base-modal @close-modal="$emit('close-modal')">
      <template #header>
        <h2>
          Subscription methods
        </h2>
      </template>
      <template #content>
        <h3>
          Choose at least one:
        </h3>
        <form>
          <div class="flex my-2 justify-between px-2">
            <label class="inline-flex items-center">
              <input
                v-model="subOptions.browser"
                type="checkbox"
                class="form-checkbox h-4 w-4 text-teal-500"
                name="browserSubscribe"
              />
              <span class="ml-2">Browser notifications</span>
            </label>
            <label class="inline-flex items-center">
              <input
                v-model="subOptions.email"
                type="checkbox"
                class="form-checkbox h-4 w-4 text-teal-500"
                name="emailSubscribe"
              />
              <span class="ml-2">Email notifications</span>
            </label>
            <label class="inline-flex items-center">
              <input
                v-model="subOptions.sms"
                type="checkbox"
                class="form-checkbox h-4 w-4 text-teal-500"
                name="smsSubscribe"
              />
              <span class="ml-2">Text messages</span>
            </label>
          </div>
          <div>
            <div class="flex justify-between mb-2">
              <input
                v-model="guest.firstName"
                class="text-input rounded-l-md"
                type="text"
                name="firstName"
                required
                placeholder="First name"
              />
              <input
                v-model="guest.lastName"
                class="text-input rounded-r-md"
                type="text"
                name="lastName"
                required
                placeholder="Last name"
              />
            </div>
            <input
              v-model="guest.email"
              class="text-input rounded-md"
              type="email"
              name="email"
              required
              placeholder="Email"
            />
            <input type="hidden" name="guestId" :value="owner.guestId" />
          </div>
        </form>
      </template>
      <template #footer>
        <base-button-cancel @click.prevent="$emit('close-modal')">
          Cancel
        </base-button-cancel>
        <base-button-purple type="submit" @click="subscribe">
          Subscribe
        </base-button-purple>
      </template>
    </base-modal>
  </transition>
</template>

<script>
import axios from 'axios';
import BaseModal from './BaseModal';
import BaseButtonPurple from './BaseButtonPurple';
import BaseButtonCancel from './BaseButtonCancel';

import { useStore } from 'vuex';
import { reactive, computed,  } from 'vue';

export default {
  components: {
    BaseModal,
    BaseButtonPurple,
    BaseButtonCancel
  },
  emits: ['close-modal'],
  setup(props, { emit }) {
    const store = useStore();
    const server = process.env.VUE_APP_SERVER;
    const subOptions = reactive({ browser: null, email: null, sms: null });

    const owner = computed(() => store.state.ownerStore.owner);
    if (!owner.value) {
      console.log('no owner.value');
      store.dispatch('getOwnerData', {
        id: store.getters.guestId,
        userType: 'guest'
      });
    }

    const guest = reactive({
      firstName: null,
      lastName: null,
      email: null,
      guestId: owner.value.guestId
    });

    function urlBase64ToUint8Array(base64String) {
      const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
      const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);

      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    }

    async function subscribeBrowser() {
      if (!guest.firstName || !guest.lastName || !guest.email) return;
      const publicVapidKey =
        'BIXOvprQOJRgsH4EHujdKRaOmrxCLTP5uKlrB_W-1pXEmCU9twuOgxIaFniDmLE8r4SAVmaTZOxOLsXdgAoWwpw';

      if ('serviceWorker' in navigator) {
        const register = await navigator.serviceWorker.register(
          process.env.VUE_APP_DEV_SW || '/sw.js',
          {
            scope: '/'
          }
        );

        const subscription = await register.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        });

        await axios({
          url: `${server}/user/subscribe-browser`,
          method: 'POST',
          data: {
            subscription: JSON.stringify(subscription),
            guestId: owner.value.guestId
          },
          headers: {
            'Content-Type': 'application/json'
          }
        });
      } else {
        alert('Sorry, notifications are not supported in this browser');
      }
    }

    function subscribeEmail() {
      axios.post(`${server}/user/subscribe-email`, guest);
    }

    async function subscribe() {
      const { browser, email } = subOptions;

      if (!browser && !email) {
        return;
      }

      const checkBrowser = () => {
        browser ? subscribeBrowser() : null;
      };
      const checkEmail = () => {
        email ? subscribeEmail() : null;
      };

      // Send subscription requests if checkboxes are checked
      Promise.all([checkBrowser(), checkEmail()])
        .then(() => {
          email || browser ? emit('close-modal') : null;
        })
        .catch(error => console.log(`Error in promises ${error}`));
    }

    return {
      subOptions,
      owner,
      guest,
      subscribe
    };
  }
};
</script>

<style scoped>
.text-input {
  @apply appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:border-blue-300  sm:text-sm sm:leading-5;
}
</style>
