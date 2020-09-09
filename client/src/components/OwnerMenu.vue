/
<template>
  <h1>Welcome Back, {{ owner.firstName }}</h1>
  <nav id="owner-menu">
    <button class="link" @click="logout">
      Log out
    </button>
    <button class="link" @click="ownerShare">
      Share
    </button>
    <button class="link" @click="nuke">
      Nuke
    </button>
    <download-zip :images="images" />
  </nav>
  <div v-if="shareUrl" class="share-modal">
    <h3>Your personal link to share:</h3>
    <div>
      <p id="share-url">
        {{ shareUrl }}
      </p>
      <!-- <button @click="copyLink">{{ copyLinkText }}</button> -->
    </div>
    <button @click="shareUrl = ''">
      Close
    </button>
  </div>
</template>

<script>
import axios from 'axios';
import DownloadZip from './DownloadZip';

export default {
  components: {
    DownloadZip,
  },
  inject: ['owner', 'images', 'nuke'],
  data() {
    return {
      server: process.env.VUE_APP_SERVER,
      shareUrl: '',
    };
  },
  methods: {
    ownerShare() {
      this.shareUrl = `${this.server}/${this.owner.guestId}/guest`;
    },
    logout() {
      axios.get(`${this.server}/logout`);
      document.cookie =
        'ownerId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;Secure';
      document.cookie =
        'connect.sid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;Secure';
      window.location.replace(`${this.server}/login`);
    },
  },
};
</script>

<style>
#owner-menu {
  display: flex;
}
.share-modal {
  position: absolute;
  z-index: 1000;
  padding: 200px;
  margin: auto;
  background-color: white;
  border: 1px solid black;
}

.share-modal {
  position: absolute;
  z-index: 1000;
  padding: 200px;
  margin: auto;
  background-color: white;
  border: 1px solid black;
}
</style>
