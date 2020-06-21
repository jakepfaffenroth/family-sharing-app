<template>
  <div>
    <h1>Welcome Back, {{ $route.params.firstName }}</h1>
    <a :href="server + '/logout'">Log out</a>
    <form :action="'http://localhost:3050/api/b2/upload'" enctype="multipart/form-data" method="POST">
      <input type="file" name="myFiles" multiple />
      <input type="submit" value="Upload" />
      <!-- <button @click="uploadFiles">Upload Images</button> -->
    </form>
    <div>
      <p style="text-align: center; margin-top:4rem">Photo grid here</p>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'PrivateSpace',
  props: {
    user: { type: Object, required: true },
  },
  data() {
    return {
      server: process.env.VUE_APP_SERVER,
      // bucket: credentials.downloadUrl + '/file/' + bucketName + '/' + fileName,
      // fileSelection: {},
    };
  },
  methods: {
    async uploadFiles() {
      await axios.post(this.server + '/api/b2/upload', {
        data: this.fileSelection,
      });
    },
  },
  async created() {
    // try {
    //   const response = await axios.get(this.bucket, { responseType: 'stream' });
    // } catch (err) {
    //   console.log(err);
    // }
  },
};
</script>

<style></style>
