<template>
  <h1>You are a guest of {{ owner.firstName }} {{ owner.lastName }}</h1>

  <button class="link" @click="openSubscribeForm">
    Subscribe
  </button>

  <div v-if="isFormVisible" class="share-modal">
    <h3>Subscription methods</h3>
    <div>
      <p id="share-url">
        Choose at least one:
      </p>
      <form @submit.prevent>
        <div>
          <input
            v-model="subOptions.browser"
            type="checkbox"
            name="browserSubscribe"
          />
          <label for="browserSubscribe">Browser notifications</label>
          <input
            v-model="subOptions.email"
            type="checkbox"
            name="emailSubscribe"
          />
          <label for="emailSubscribe">Email notifications</label>
        </div>
        <div>
          <input
            v-model="guest.firstName"
            type="text"
            name="firstName"
            required="true"
            placeholder="First name"
          />
          <input
            v-model="guest.lastName"
            type="text"
            name="lastName"
            placeholder="Last name"
          />
          <input
            v-model="guest.email"
            type="text"
            name="email"
            placeholder="email"
          />
          <input type="hidden" name="guestId" :value="owner.guestId" />
        </div>
      </form>
    </div>
    <button @click="subscribe">
      Subscribe
    </button>
    <button @click="isFormVisible = false">
      Cancel
    </button>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  props: { owner: { type: Object, default: null } },
  data() {
    return {
      server: process.env.VUE_APP_SERVER,
      subOptions: { browser: null, email: null },
      guest: {
        firstName: null,
        lastName: null,
        email: null,
        guestId: this.owner.guestId,
      },
      isFormVisible: false,
    };
  },
  methods: {
    openSubscribeForm() {
      this.isFormVisible = true;
    },

    urlBase64ToUint8Array(base64String) {
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
    },

    async subscribeBrowser() {
      console.log('test');
      if (!this.guest.firstName || !this.guest.lastName || !this.guest.email)
        return;
      const publicVapidKey =
        'BIXOvprQOJRgsH4EHujdKRaOmrxCLTP5uKlrB_W-1pXEmCU9twuOgxIaFniDmLE8r4SAVmaTZOxOLsXdgAoWwpw';

      if ('serviceWorker' in navigator) {
        console.log(process.env.VUE_APP_DEV_SW);
        const register = await navigator.serviceWorker.register(
          process.env.VUE_APP_DEV_SW || '/sw.js',
          {
            scope: '/',
          }
        );

        const subscription = await register.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(publicVapidKey),
        });

        await axios({
          url: `${this.server}/user/subscribe-browser`,
          method: 'POST',
          data: {
            subscription: JSON.stringify(subscription),
            guestId: this.owner.guestId,
          },
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } else {
        alert('Sorry, notifications are not supported in this browser');
      }
    },

    subscribeEmail() {
      console.log('guest:', this.guest);
      axios.post(`${this.server}/user/subscribe-email`, this.guest);
    },

    async subscribe() {
      const { browser, email } = this.subOptions;

      const checkBrowser = () => {
        browser ? this.subscribeBrowser() : null;
      };
      const checkEmail = () => {
        email ? this.subscribeEmail() : null;
      };

      // Send subscription requests if checkboxes are checked
      Promise.all([checkBrowser(), checkEmail()])
        .then(() => {
          email || browser ? (this.isFormVisible = false) : null;
        })
        .catch((error) => console.log(`Error in promises ${error}`));
    },
  },
};
</script>

<style></style>
