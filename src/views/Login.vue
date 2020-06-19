<template>
  <div>
    <h1>Log in to your account</h1>
    <!-- TODO - the action needs to POST to the servet URL, not the client URL... -->
    <form :action="server + '/api/login'" method="post">
    <label>{{server}}</label>
      <div>
        <label>Username:</label>
        <input type="text" name="username" />
      </div>
      <div>
        <label>Password:</label>
        <input type="password" name="password" />
      </div>
      <div>
        <input type="submit" value="Log In" />
      </div>
    </form>
  </div>
</template>

<script>
export default {
  name: 'Login',
  data() {
    return {
      server: process.env.VUE_APP_SERVER,
    };
  },
};
</script>

<style></style>
