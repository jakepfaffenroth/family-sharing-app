<template>
  <div>
    <h1>Welcome Back, {{ owner.firstName }}</h1>
    <a :href="server + '/logout'">Log out</a>
    <form
      :action="'http://localhost:3050/api/b2/upload'"
      enctype="multipart/form-data"
      method="POST"
    >
      <input type="file" name="myFiles" multiple />
      <!-- <input type="hidden" name="ownerId" :value="owner._id" /> -->
      <input type="submit" value="Upload" />
    </form>
    <div v-if="fileList.length > 0" class="image-grid">
      <!-- <p>Showing images from folder {{}}</p> -->
      <img
        v-for="(image, index) in fileList"
        :key="index.fileId"
        :src="basePath + image.fileName"
        class="image"
      />
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'PrivateSpace',
  data() {
    return {
      server: process.env.VUE_APP_SERVER,
      owner: {},
      b2Credentials: {},
      filePrefix: 'test',
      ownerId: this.$store.getters.owner.ownerId,
      fileList: [],
      basePath: 'https://f000.backblazeb2.com/file/JFP001/',
    };
  },
  async created() {
    this.b2Credentials = this.$store.getters.b2Credentials;
    this.owner = this.$store.getters.owner;
    try {
      const response = await axios({
        url: `${this.server}/api/b2/list-files`,
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
