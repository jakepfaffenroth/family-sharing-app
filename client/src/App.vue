<template>
  <div>
    <div v-if="isReadyToRender">
      <!-- Owner header and navigation -->
      <div v-if="userType == 'owner'">
        <h1>Welcome Back, {{ user.firstName }}</h1>
        <button @click="logout" class="link">Log out</button>
        <button @click="ownerShare" class="link">Share</button>
        <button @click="nuke" class="link">Nuke</button>
        <download-zip :images="images" />

        <div v-if="shareUrl" class="share-modal">
          <h3>Your personal link to share:</h3>
          <div>
            <p id="share-url">{{ shareUrl }}</p>
            <!-- <button @click="copyLink">{{ copyLinkText }}</button> -->
          </div>
          <button @click="shareUrl = ''">Close</button>
        </div>
      </div>

      <!-- Guest header and navigation -->
      <div v-if="userType == 'guest'">
        <h1>You are a guest of {{ user.firstName }} {{ user.lastName }}</h1>

        <button @click="openSubscribeForm" class="link">Subscribe</button>

        <div v-if="guest.guestId" class="share-modal">
          <h3>Subscription methods</h3>
          <div>
            <p id="share-url">Choose at least one:</p>
            <form @submit.prevent>
              <div>
                <input type="checkbox" name="browserSubscribe" v-model="subOptions.browser" />
                <label for="browserSubscribe">Browser notifications</label>
                <input type="checkbox" name="emailSubscribe" v-model="subOptions.email" />
                <label for="emailSubscribe">Email notifications</label>
              </div>
              <div>
                <input
                  type="text"
                  name="firstName"
                  required="true"
                  placeholder="First name"
                  v-model="guest.firstName"
                />
                <input type="text" name="lastName" placeholder="Last name" v-model="guest.lastName" />
                <input type="text" name="email" placeholder="email" v-model="guest.email" />
                <input type="hidden" name="guestId" :value="guest.guestId" />
              </div>
            </form>
          </div>
          <button @click="subscribe">Subscribe</button>
          <button @click="guest.guestId = ''">Cancel</button>
        </div>
      </div>

      <p>Image count: {{ images.length }}</p>
      <div id="progress" v-if="progress !== '0%'">
        <div id="progress-bar" :style="{ width: progress }">
          <span id="progress-label">{{ progress }}</span>
        </div>
      </div>

      <vue-dropzone
        v-if="userType == 'owner'"
        ref="myVueDropzone"
        id="dropzone"
        :options="dropzoneOptions"
        @vdropzone-sending="sendingEvent"
        @vdropzone-success="updateImages"
        @vdropzone-total-upload-progress="uploadProgress"
        @vdropzone-error="uploadError"
      />
      <image-sorter v-on:sort-images="sortImages" />

      <vue-picture-swipe
        :items="images"
        :user="user"
        :userType="userType"
        v-on:delete-image="deleteImage"
      ></vue-picture-swipe>

      <div v-if="images.length === 0 && userType === 'owner' && user.userId">
        <p>Upload your first images!</p>
      </div>
    </div>
    <div></div>
  </div>
</template>

<script scoped>
import axios from 'axios';
import vue2Dropzone from './components/VueDropzone';
import 'vue2-dropzone/dist/vue2Dropzone.min.css';
import VuePictureSwipe from './components/VuePictureSwipe';
import ImageSorter from './components/ImageSorter';
import DownloadZip from './components/DownloadZip';

export default {
  props: {},
  components: {
    vueDropzone: vue2Dropzone,
    VuePictureSwipe,
    ImageSorter,
    DownloadZip,
  },
  provide() {
    return {
      userType: 'guest',
      user: {},
      images: this.images,
    };
  },
  data() {
    return {
      server: process.env.VUE_APP_SERVER,
      isReadyToRender: false,
      userType: 'guest',
      user: {},
      images: [],
      shareUrl: '',
      guest: {
        firstName: null,
        lastName: null,
        email: null,
        guestId: null,
      },
      subOptions: {
        browser: null,
        email: null,
      },
      dropzoneOptions: {
        url: process.env.VUE_APP_SERVER + '/files/upload',
        paramName: 'myFiles',
        acceptedFiles: 'image/*',
        timeout: 600000,
        uploadMultiple: true,
        parallelUploads: 200,
        maxFilesize: 350,
        thumbnailWidth: 120,
        thumbnailHeight: 120,
        thumbnailMethod: 'contain',
        addRemoveLinks: true,
      },
      progress: '0%',
      bytesSent: 0,
      // copyLinkText: 'Copy link',
    };
  },
  computed: {
    progressLabel: function() {
      return this.progress;
    },
  },
  methods: {
    nuke() {
      let images = this.images;
      this.images = [];

      axios.post(this.server + '/files/delete-image', {
        images: images,
        userId: this.user.userId,
      });
    },

    openSubscribeForm() {
      this.guest.guestId = this.user.guestId;
    },

    urlBase64ToUint8Array(base64String) {
      const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
      const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);

      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    },

    async subscribeBrowser() {
      if (!this.guest.firstName || !this.guest.lastName || !this.guest.email) return;
      const publicVapidKey = 'BIXOvprQOJRgsH4EHujdKRaOmrxCLTP5uKlrB_W-1pXEmCU9twuOgxIaFniDmLE8r4SAVmaTZOxOLsXdgAoWwpw';

      if ('serviceWorker' in navigator) {
        let register;
        // If statement to conditionally register production vs dev service workers
        console.log('process.env.SERVER: ', process.env.VUE_APP_SERVER);
        if (process.env.VUE_APP_SERVER == 'http://localhost:3400') {
          register = await navigator.serviceWorker.register('/devSw.js', {
            scope: '/',
          });
        }
        if (process.env.VUE_APP_SERVER == 'https://carousel.jakepfaf.dev') {
          register = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
          });
        }

        const subscription = await register.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(publicVapidKey),
        });
        // console.log({message: JSON.stringify(subscription)});

        await axios({
          url: this.server + '/guest/subscribe-browser',
          method: 'POST',
          data: { subscription: JSON.stringify(subscription), guestId: this.user.guestId },
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } else {
        alert('Sorry, notifications are not supported in this browser');
      }
    },

    subscribeEmail() {
      axios.post(this.server + '/guest/subscribe-email', this.guest);
    },

    async subscribe() {
      const browser = this.subOptions.browser;
      const email = this.subOptions.email;

      const checkBrowser = () => {
        browser ? this.subscribeBrowser() : null;
      };
      const checkEmail = () => {
        email ? this.subscribeEmail() : null;
      };

      // Send subscription requests if checkboxes are checked
      Promise.all([checkBrowser(), checkEmail()])
        .then(() => {
          email || browser ? (this.guest.guestId = '') : null;
        })
        .catch((error) => console.log(`Error in promises ${error}`));
    },

    sendingEvent(file, xhr, formData) {
      if (!formData.get('userId')) {
        formData.append('userId', this.user.userId);
      }
      if (!formData.get('guestId')) {
        formData.append('guestId', this.user.guestId);
      }
    },

    updateImages(file, response) {
      console.log('response: ', response);
      for (let i = 0; i < response.length; i++) {
        response[i].thumbnail.replace(/\/full\//, '/small/');
        console.log('response[i]: ', response[i]);
        this.images.unshift(response[i]);
        response.splice(i, 1);
      }
      this.$refs.myVueDropzone.removeFile(file);
      this.progress = '0%';
    },

    uploadProgress(progress, totalBytes, bytesSent) {
      this.progress = `${progress.toFixed(2)}%`;
      this.bytesSent = bytesSent;
      this.progress >= 100 ? (this.progress = 0) : null;
    },

    sortImages(sortParameter) {
      if (sortParameter === 'reverse') {
        this.images.reverse();
        return;
      }

      const compare = (a, b) => {
        let fileA, fileB;

        if (sortParameter === 'captureTime') {
          fileA = a.exif.exif.DateTimeOriginal || null;
          fileB = b.exif.exif.DateTimeOriginal || null;
        }
        if (sortParameter === 'uploadTime') {
          fileA = a.uploadTime;
          fileB = b.uploadTime;
        }

        let comparison = 0;
        if (fileA > fileB) {
          comparison = -1;
        } else if (fileA < fileB) {
          comparison = 1;
        }
        return comparison;
      };

      this.images.sort(compare);
    },

    uploadError(file, message, xhr) {
      console.log('Upload Error: ', message, xhr);
    },

    ownerShare() {
      this.shareUrl = `${this.server}/${this.user.guestId}/guest`;
    },

    async deleteImage(fileId, smallFileId, fileName, userId, index) {
      console.log(fileId, fileName)
      this.images.splice(index, 1);
      axios.post(this.server + '/files/delete-image', { fileId: fileId, fileName: fileName, userId: userId });
    },

    logout() {
      axios.get(this.server + '/logout');
      document.cookie = 'ownerId=; max-age=0';
      document.cookie = 'connect.sid=; max-age=0';
      window.location = this.server + '/login';
    },
  },

  beforeCreate() {
    // user id is passed as query param from server after login
    // set cookie with id and clear query from url & history
    // if there's no query param (user went to site directly) then
    // don't change the cookie
    const params = new URLSearchParams(window.location.search);
    const uId = params.get('user');
    const gId = params.get('guest');
    if (uId) {
      document.cookie = 'ownerId=' + uId;
      window.history.replaceState(null, '', '/');
    }
    // Same for guestId
    if (gId) {
      document.cookie = 'guestId=' + gId;
      window.history.replaceState(null, '', '/');
    }
  },

  async created() {
    // Prevent right clicking images
    document.addEventListener('contextmenu', (event) => {
      if (event.target.nodeName === 'IMG') {
        event.preventDefault();
      }
    });

    const getCookie = (userType) => {
      const cookieArr = document.cookie.split(';');

      // Loop through the array elements
      for (let i = 0; i < cookieArr.length; i++) {
        const cookiePair = cookieArr[i].split('=');

        /* Removing whitespace at the beginning of the cookie name
        and compare it with the given string */
        if (userType == cookiePair[0].trim()) {
          // Decode the cookie value and return
          return decodeURIComponent(cookiePair[1]);
        }
      }
    };

    const ownerId = getCookie('ownerId');
    const guestId = getCookie('guestId');

    // if logged in as an owner, directs to owner home
    if (ownerId) {
      const response = await axios({
        url: this.server + '/auth/check-session',
        method: 'post',
        data: { userId: ownerId },
      });
      if (!response.data.isLoggedIn) {
        window.location = this.server + '/login';
      }
      console.log('response.data: ', response.data);
      this.userType = 'owner';
      this.user = response.data.user;
      this.sortImages('uploadTime');
      this.images = response.data.images.reverse();
      this.isReadyToRender = true;
    }

    // If NOT logged in as owner, but has a guestId (from owner's share URL)
    // then direct to owner's guest page
    if (guestId && !ownerId) {
      const response = await axios({
        url: this.server + '/user/get-user',
        method: 'post',
        data: { guestId: guestId },
      });

      this.user = response.data.user;
      this.images = response.data.images.reverse();
      console.log('this.user: ', this.user);
      console.log('this.images: ', this.images);
      this.isReadyToRender = true;
      this.sortImages('uploadTime');
    }

    // Prevent users from viewing app without login or guestId
    if (!guestId && !ownerId) {
      window.location = this.server;
    }
  },
};
</script>

<style scoped>
#dropzone {
  width: 60vw;
  margin: auto;
}

#progress {
  width: 100%;
  background-color: grey;
  border: 1px solid black;
}

#progress-bar {
  height: 30px;
  background-color: green;
}

.link {
  border: none;
  background: none;
  cursor: pointer;
}
.link:hover {
  color: blue;
}

.image-grid {
  margin-top: 1rem;
}

#silentbox-gallery {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

.image-container {
  position: relative;
  margin: 0.25rem;
  overflow: hidden;
  height: 250px;
}

.image {
  flex: auto;
  height: 250px;
  min-width: 100px;
  object-fit: contain;
  transition: 0.2s ease-in-out;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
}

.image-container:hover .image {
  scale: 1.1;
  object-fit: cover;
}

.image-container:hover .image-overlay {
  opacity: 1;
  transition: all 0.2s ease-in-out;
}
.delete-btn {
  position: absolute;
  top: 10px;
  right: 10px;
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
