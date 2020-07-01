<template>
  <div>
    <div v-if="isReadyToRender">
      <div v-if="userType == 'owner'">
        <h1>Welcome Back, {{ user.firstName }}</h1>
        <button @click="logout" class="link">Log out</button>
        <button @click="ownerShare" class="link">Share</button>
        <div v-if="shareUrl" class="share-modal">
          <h3>Your personal link to share:</h3>
          <p>{{ shareUrl }}</p>
          <button @click="shareUrl = ''">Close</button>
        </div>
      </div>

      <div v-if="userType == 'guest'">
        <h1>You are a guest of {{ user.firstName }} {{ user.lastName }}</h1>
      </div>

      <vue-dropzone
        v-if="userType == 'owner'"
        ref="myVueDropzone"
        id="dropzone"
        :options="dropzoneOptions"
        @vdropzone-sending="sendingEvent"
      />

      <div v-if="fileList.length === 0 && userType === 'owner' && user._id">
        <p>Upload your first images!</p>
      </div>
      <div v-if="fileList.length > 0" class="image-grid">
        <!-- <p>Showing images from folder {{}}</p> -->
        <img v-for="(image, index) in fileList" :key="index" :src="image" class="image" />
      </div>
    </div>
    <div></div>
  </div>
</template>

<script>
import axios from 'axios';
import vue2Dropzone from 'vue2-dropzone';
import 'vue2-dropzone/dist/vue2Dropzone.min.css';

export default {
  props: {},
  components: {
    vueDropzone: vue2Dropzone,
  },
  data() {
    return {
      server: process.env.VUE_APP_SERVER,
      isReadyToRender: false,
      userType: 'guest',
      user: {},
      shareUrl: '',
      files: '',
      b2Credentials: {},
      filePrefix: 'test',
      // userId: this.$store.getters.user._id,
      fileList: [],
      basePath: 'https://f000.backblazeb2.com/file/JFP001/',
      dropzoneOptions: {
        url: process.env.VUE_APP_SERVER + '/files/upload',
        paramName: 'myFiles',
        uploadMultiple: true,
        parallelUploads: 5,
        thumbnailWidth: 150,
        // headers: { 'My-Awesome-Header': 'header value' },
        addRemoveLinks: true,
      },
    };
  },
  methods: {
    async getUserImages() {
      // const response = await axios({
      //   url: this.server + '/files/list-files',
      //   method: 'post',
      //   data: { filePrefix: this.user._id },
      // });
      // this.fileList = response.data.files;
      const basePath = 'https://f000.backblazeb2.com/b2api/v1/b2_download_file_by_id?fileId=';
      this.user.images.forEach((fileId) => {
        this.fileList.push(basePath + fileId);
      });
    },

    sendingEvent(file, xhr, formData) {
      if (!formData.get('userId')) {
        formData.append('userId', this.user._id);
      }
      // this.getUserImages();
    },

    ownerShare() {
      this.shareUrl = `${this.server}/${this.user._id}/guest`;
    },

    logout() {
      axios.get(this.server + '/logout');
      this.$cookies.remove('ownerId');
      this.$cookies.remove('connect.sid');
      window.location = this.server + '/login';
    },
  },
  async created() {
    const ownerId = this.$cookies.get('ownerId');
    const guestId = this.$cookies.get('guestId');
    // if (!ownerId && !guestId) {
    //   window.location = this.server;
    // }
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
      this.user.images = response.data.user.images;
      // this.getUserImages()
      this.isReadyToRender = true;
    }
    if (guestId && !ownerId) {
      console.log('ownerId: ', ownerId);
      console.log('guestId: ', guestId);

      const response = await axios({
        url: this.server + '/user/get-user',
        method: 'post',
        data: { userId: guestId },
      });

      console.log('response: ', response);
      this.user = response.data;
      this.isReadyToRender = true;
    }
    try {
      this.getUserImages();
    } catch (err) {
      console.log(err);
    }
  },
};
</script>

<style>
#dropzone {
  width: 60vw;
  margin: auto;
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
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 1rem;
}

.image {
  max-width: 400px;
  max-height: 400px;
  margin: 0.5rem;
  object-fit: contain;
  transition: opacity 0.1s ease-in-out;
}
.image:hover {
  opacity: 0.7;
}

.skeleton-image {
  background-color: gray;
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
