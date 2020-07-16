<template>
  <p>test</p>
</template>

<script>
import axios from 'axios';

export default {
  async created() {
    try {
      const response = await axios.get(process.env.VUE_APP_SERVER + '/user-auth');
      console.log('response: ',response);
      response.data.authorized ? console.log('authorized!') : console.log('Not authorized!');
    } catch (err) {
      console.log('Error: ', err);
    }
  },
};
</script>

<style></style>
