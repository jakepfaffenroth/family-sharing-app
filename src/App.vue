<template>
  <div v-if="isReadyToRender">
    <h1>Welcome Back, {{ user.firstName }}</h1>
    <button @click="logout" class="link">Log out</button>
    <form :action="server + '/files/upload'" enctype="multipart/form-data" method="POST">
      <input type="file" name="myFiles" multiple />
      <input type="hidden" name="userId" :value="user._id" />
      <input type="submit" value="Upload" />
    </form>
    <div v-if="fileList.length > 0" class="image-grid">
      <!-- <p>Showing images from folder {{}}</p> -->
      <img v-for="(image, index) in fileList" :key="index.fileId" :src="basePath + image.fileName" class="image" />
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  props: {
    // user: { type: Object, required: true },
    // credentials: { type: Object, required: true },
  },
  data() {
    return {
      server: process.env.VUE_APP_SERVER,
      isReadyToRender: false,
      user: {},
      b2Credentials: {},
      filePrefix: 'test',
      // userId: this.$store.getters.user._id,
      fileList: [],
      basePath: 'https://f000.backblazeb2.com/file/JFP001/',
    };
  },
  methods: {
    logout() {
      axios.get(this.server + '/logout');
      this.$cookies.remove('user._id');
      this.$cookies.remove('connect.sid');
      window.location = this.server + '/login';
    },
    // async uploadFiles() {
    //   await axios.post(this.server + '/api/b2/upload', {
    //     data: this.fileSelection,
    //   });
    // },
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
    // try {
    //   const response = await axios.get(this.server + '/user-auth', {withCredentials: true});
    //   if (!response.data.user) {
    //     this.$router.push({ name: 'Login' });
    //     console.log('round trip from login to user-area back to login')
    //   }
    //   console.log('response: ', response);
    // } catch (err) {
    //   console.log(err);
    // }

    // this.b2Credentials = this.$store.getters.b2Credentials;
    // this.user = this.$store.getters.user;
    try {
      const response = await axios({
        url: this.server + '/files/list-files',
        method: 'post',
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
