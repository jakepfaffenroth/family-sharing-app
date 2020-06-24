<template>
  <div>
    <h1>Log in to your account</h1>
    <!-- TODO - the action needs to POST to the servet URL, not the client URL... -->
    <form @submit.prevent="login">
      <div>
        <label>Username:</label>
        <input type="text" name="username" v-model="username" />
      </div>
      <div>
        <label>Password:</label>
        <input type="password" name="password" v-model="password" />
      </div>
      <div>
        <input type="submit" value="Log In" />
      </div>
    </form>
    <p v-if="incorrectCred">Incorrect username or password</p>
  </div>
</template>

<script>
// import router from '../router/index';
import axios from 'axios';
import store from '../store/index';

export default {
  name: 'Login',
  data() {
    return {
      server: process.env.VUE_APP_SERVER,
      username: 'TestTesterson',
      password: '1234',
      incorrectCred: false,
    };
  },
  methods: {
    login() {
      // e.preventDefault();
      console.log('attempting login...');
      let login = async () => {
        let body = {
          username: this.username,
          password: this.password,
        };
        try {
          let response = await axios.post(this.server + '/api/login', body);
          // Login on server successful
          console.log('Logged in');
          // console.log(response.data)
          let userId = response.data.user._id;
          store.commit('setCredentials', response.data.credentials);
          store.commit('setUser', response.data.user);
          // document.cookie = "userId="+userId
          // open PrivateSpace page
          this.$router.push({ name: 'UserArea', params: { userId } });
        } catch (error) {
          console.log('error: ', error);
          console.log('Cannot log in');
          this.incorrectCred = true;
        }
      };

      login();
    },
  },
  async created() {
    try {
      const response = await axios.get(this.server + '/user-auth', { withCredentials: true });
      if (!response.data.user) {
        console.log('Not logged in yet')
        // this.$router.push({ name: 'Login' });
      }
      console.log('response: ', response);
      // this.$router.push({ name: 'UserArea' });
    } catch (err) {
      console.log(err);
    }
  },
};
</script>

<style></style>
