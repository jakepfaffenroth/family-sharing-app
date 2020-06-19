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

export default {
  name: 'Login',
  data() {
    return {
      server: process.env.VUE_APP_SERVER,
      username: '',
      password: '',
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
          console.log('Logged in');
          let user = response.data;
          this.$router.push({ name: 'PrivateSpace', params: user });
        } catch (error) {
          console.log('error: ', error);
          console.log('Cannot log in');
          this.incorrectCred = true;
        }
      };

      login();
    },
  },
};
</script>

<style></style>
