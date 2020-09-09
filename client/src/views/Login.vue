<template>
  <div>
    <h1>Log in to your account</h1>
    <form @submit.prevent="login">
      <div>
        <label>Username:</label>
        <input v-model="username" type="text" name="username" />
      </div>
      <div>
        <label>Password:</label>
        <input v-model="password" type="password" name="password" />
      </div>
      <div>
        <input type="submit" value="Log In" />
      </div>
    </form>
    <p v-if="incorrectCred">
      Incorrect username or password
    </p>
  </div>
</template>

<script>
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
  async created() {
    try {
      const response = await axios.get(`${this.server}/owner-auth`, {
        withCredentials: true,
      });
      if (!response.data.owner) {
        console.log('Not logged in yet');
      }
      console.log('response: ', response);
    } catch (err) {
      console.log(err);
    }
  },
  methods: {
    login() {
      console.log('attempting login...');
      const login = async () => {
        const body = {
          username: this.username,
          password: this.password,
        };
        try {
          const response = await axios.post(`${this.server}/api/login`, body);
          // Login on server successful
          console.log('Logged in');
          // console.log(response.data)
          const { ownerId } = response.data.owner;
          store.commit('setCredentials', response.data.credentials);
          store.commit('setOwner', response.data.owner);
          // open PrivateSpace page
          this.$router.push({ name: 'OwnerArea', params: { ownerId } });
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
