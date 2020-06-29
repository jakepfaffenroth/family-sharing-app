<template>
  <div v-if="isReadyToRender">
    <h1>Welcome Back, {{ user.firstName }}</h1>
    <button @click="logout" class="link">Log out</button>

    <vue-dropzone ref="myVueDropzone" id="dropzone" :options="dropzoneOptions" @vdropzone-sending="sendingEvent" />

    <div v-if="fileList.length > 0" class="image-grid">
      <!-- <p>Showing images from folder {{}}</p> -->
      <img v-for="(image, index) in fileList" :key="index.fileId" :src="basePath + image.fileName" class="image" />
    </div>
    <div v-if="fileList.length === 0">
      <p>Upload your first images</p>
    </div>
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
      user: {},
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
    async submit() {
      const files = this.$refs.form[0].files;
      console.log('files: ', files);
      const formData = new FormData();
      for (var i = 0; i < files.length; i++) {
        let file = files[i];
        formData.append('files[' + i + ']', file);
        console.log('formData: ', formData);
      }
      const response = await axios.post(this.server + '/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('response.data: ', response.data);
    },

    sendingEvent(file, xhr, formData) {
      if (!formData.get('userId')) {
        formData.append('userId', this.user._id);
      }
    },

    logout() {
      axios.get(this.server + '/logout');
      this.$cookies.remove('user._id');
      this.$cookies.remove('connect.sid');
      window.location = this.server + '/login';
    },
  },
  async beforeCreate() {},
  async created() {
    let userId;
    userId = this.$cookies.get('user._id');
    const response = await axios({
      url: this.server + '/auth/check-session',
      method: 'post',
      data: { userId: userId },
    });
    if (!response.data.isLoggedIn) {
      window.location = this.server + '/login';
    }
    this.user._id = response.data.user._id;
    this.user.firstName = response.data.user.firstName;
    this.isReadyToRender = true;
    try {
      const response = await axios({
        url: this.server + '/files/list-files',
        method: 'post',
        data: { filePrefix: this.user._id },
      });
      this.fileList = response.data.files;
      // !this.fileList.length ? this.fileList.push("Upload your first images!") : this.fileList
    } catch (err) {
      console.log(err);
    }
  },
};
</script>

<style>
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
  margin: 0.5rem;
  transition: opacity 0.1s ease-in-out;
}
.image:hover {
  opacity: 0.7;
  overlay: black;
}
</style>
