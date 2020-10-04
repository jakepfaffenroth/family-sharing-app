<template>
  <transition name="slide-fade">
    <modal @close-modal="$emit('toggle-form')">
      <div class="text-white">
        <h3 class="text-xl">
          Subscription methods
        </h3>
        <div class="font-light mt-2">
          <p>
            Choose at least one:
          </p>
          <form>
            <div class="my-2 space-x-2">
              <label class="inline-flex items-center">
                <input
                  v-model="subOptions.browser"
                  type="checkbox"
                  class="form-checkbox h-4 w-4 text-teal-400"
                  name="browserSubscribe"
                />
                <span class="ml-2">Browser notifications</span>
              </label>
              <label class="inline-flex items-center">
                <input
                  v-model="subOptions.email"
                  type="checkbox"
                  class="form-checkbox h-4 w-4 text-teal-400"
                  name="emailSubscribe"
                />
                <span class="ml-2">Email notifications</span>
              </label>
            </div>
            <div class="">
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
            <div class="flex mt-4 space-x-4">
              <button
                class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-teal-600 hover:bg-teal-500 focus:outline-none focus:border-teal-700 focus:shadow-outline-teal active:bg-teal-700 transition duration-150 ease-in-out"
                @click.prevent="$emit('toggle-form')"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-teal-600 hover:bg-teal-500 focus:outline-none focus:border-teal-700 focus:shadow-outline-teal active:bg-teal-700 transition duration-150 ease-in-out"
                @click="subscribe"
              >
                Subscribe
              </button>
            </div>
          </form>
        </div>
      </div>
    </modal>
  </transition>
</template>

<script>
import axios from 'axios';
import Modal from './Modal';

import { reactive, isReactive, onMounted } from 'vue';

export default {
  components: {
    Modal
  },
  props: { owner: { type: Object, default: null } },
  emits: ['toggle-form'],
  setup(props, { emit }) {
    const server = process.env.VUE_APP_SERVER;
    const subOptions = reactive({ browser: null, email: null });
    const guest = reactive({
      firstName: null,
      lastName: null,
      email: null,
      guestId: props.owner.guestId
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
      console.log('test');
      if (!guest.firstName || !guest.lastName || !guest.email) return;
      const publicVapidKey =
        'BIXOvprQOJRgsH4EHujdKRaOmrxCLTP5uKlrB_W-1pXEmCU9twuOgxIaFniDmLE8r4SAVmaTZOxOLsXdgAoWwpw';

      if ('serviceWorker' in navigator) {
        // console.log(process.env.VUE_APP_DEV_SW);
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
            guestId: props.owner.guestId
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
      console.log('guest:', guest);
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
          email || browser ? emit('toggle-form') : null;
        })
        .catch(error => console.log(`Error in promises ${error}`));
    }

    return { server, subOptions, guest, subscribe };
  }
};
</script>

<style scoped></style>
