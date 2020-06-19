<template>
  <h1>Welcome Back, {{$route.params.firstName}}</h1>
  <a :href="server + '/logout'">Log out</a>
</template>

<script>
export default {
  name: 'PrivateSpace',
  props: {
    user: { type: Object, required: true },
  },
  data() {
    return {
      server: process.env.VUE_APP_SERVER,
    };
  },
};
</script>

<style></style>
