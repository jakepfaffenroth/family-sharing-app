<template>
  <div>
    <h1>Welcome Back, {{ user.firstName }}</h1>
    <a :href="server + '/logout'">Log out</a>
    <form :action="'http://localhost:3050/api/b2/upload'" enctype="multipart/form-data" method="POST">
      <input type="file" name="myFiles" multiple />
      <input type="hidden" name="userId" :value="$store.getters.user._id" />
      <input type="submit" value="Upload" />
    </form>
    <div v-if="fileList.length > 0" class="image-grid">
      <img v-for="(image, index) in fileList" :key="index.fileId" :src="basePath + image.fileName" class="image" />
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'PrivateSpace',
  props: {
    // user: { type: Object, required: true },
    // credentials: { type: Object, required: true },
  },
  data() {
    return {
      server: process.env.VUE_APP_SERVER,
      user: {},
      b2Credentials: {},
      filePrefix: 'test',
      userId: this.$store.getters.user._id,
      fileList: [],
      basePath: 'https://f000.backblazeb2.com/file/JFP001/',
    };
  },
  methods: {
    // async uploadFiles() {
    //   await axios.post(this.server + '/api/b2/upload', {
    //     data: this.fileSelection,
    //   });
    // },
  },
  async created() {
    this.b2Credentials = this.$store.getters.b2Credentials;
    this.user = this.$store.getters.user;
    try {
      const response = await axios({
        url: this.server + '/api/b2/list-files',
        method: 'POST',
        data: { filePrefix: this.filePrefix },
      });
      this.fileList = response.data.files;
    } catch (err) {
      console.log(err);
    }
  },
};
</script>

<style>
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
