<template>
  <div>
    <div v-if="isReadyToRender">
      <div v-if="userType == 'owner'">
        <h1>Welcome Back, {{ user.firstName }}</h1>
        <button @click="logout" class="link">Log out</button>
        <button @click="ownerShare" class="link">Share</button>
        <button @click="nuke" class="link">Nuke</button>

        <div v-if="shareUrl" class="share-modal">
          <h3>Your personal link to share:</h3>
          <div>
            <p id="share-url">{{ shareUrl }}</p>
            <!-- <button @click="copyLink">{{ copyLinkText }}</button> -->
          </div>
          <button @click="shareUrl = ''">Close</button>
        </div>
      </div>

      <div v-if="userType == 'guest'">
        <h1>You are a guest of {{ user.firstName }} {{ user.lastName }}</h1>
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
        v-on:deleteImage="deleteImage"
      ></vue-picture-swipe>

      <div v-if="images.length === 0 && userType === 'owner' && user._id">
        <p>Upload your first images!</p>
      </div>
      <!-- <div v-if="images.length > 0" class="image-grid">
        <div v-for="(image, index) in images" :key="index" class="image-container">
          <img :src="basePath + image.fileName" class="image" />
          <div class="image-overlay">
            <form @submit.prevent="deleteImage(image.fileId, image.fileName, user._id, index)">
              <input
                type="submit"
                class="delete-btn"
                value="Delete"
                v-if="images.length >= 0 && userType === 'owner' && user._id"
              />
            </form>
          </div>
        </div>        
            </div>
        </div>        
            </div>
        </div>        
            </div>
        </div>        
          </div>
        </div>        
          </div>
        </div>        
      </div> -->
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

export default {
  props: {},
  components: {
    vueDropzone: vue2Dropzone,
    VuePictureSwipe,
    ImageSorter,
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
      // toggler: false,
      server: process.env.VUE_APP_SERVER,
      isReadyToRender: false,
      userType: 'guest',
      user: {},
      images: [],
      shareUrl: '',
      files: '',
      b2Credentials: {},
      filePrefix: 'test',
      // userId: this.$store.getters.user._id,
      fileList: [],
      basePath: process.env.VUE_APP_STORAGE,
      dropzoneOptions: {
        url: process.env.VUE_APP_SERVER + '/files/upload',
        paramName: 'myFiles',
        acceptedFiles: 'image/*',
        uploadMultiple: true,
        parallelUploads: 2,
        thumbnailWidth: 120,
        thumbnailHeight: 120,
        thumbnailMethod: 'contain',
        // headers: { 'My-Awesome-Header': 'header value' },
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
      images.forEach((image) => {
        axios.post(this.server + '/files/delete-image', {
          fileId: image.fileId,
          fileName: image.fileName,
          userId: this.user._id,
        });
      });
    },
    getUserImages() {
      // const basePath = 'https://f000.backblazeb2.com/b2api/v1/b2_download_file_by_id?fileId=';
      // this.images.forEach((fileId) => {
      //   this.fileList.push(basePath + fileId);
      // });
    },

    sendingEvent(file, xhr, formData) {
      if (!formData.get('userId')) {
        formData.append('userId', this.user._id);
      }
    },

    updateImages(file, response) {
      for (let i = 0; i < response.length; i++) {
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
          comparison = 1;
        } else if (fileA < fileB) {
          comparison = -1;
        }
        return comparison;
      };

      this.images.sort(compare);
    },

    uploadError(file, message, xhr) {
      console.log('Upload Error: ', message, xhr);
    },

    ownerShare() {
      this.shareUrl = `${this.server}/${this.user._id}/guest`;
    },

    async deleteImage(fileId, fileName, userId, index) {
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
      this.userType = 'owner';
      this.user._id = response.data.user._id;
      this.user.firstName = response.data.user.firstName;
      this.images = response.data.user.images.reverse();
      this.isReadyToRender = true;
    }

    // If NOT logged in as owner, but has a guestId (from owner's share URL)
    // then direct to owner's guest page
    if (guestId && !ownerId) {
      const response = await axios({
        url: this.server + '/user/get-user',
        method: 'post',
        data: { userId: guestId },
      });

      this.user = response.data;
      this.images = response.data.images.reverse();
      this.isReadyToRender = true;
    }

    // Prevent users from viewing app without login or guestId
    if (!guestId && !ownerId) {
      window.location = this.server;
    }
    // try {
    //   this.getUserImages();
    // } catch (err) {
    //   console.log(err);
    // }
  },
};
</script>

<style>
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
