import { createApp } from 'vue';
import router from './router';
import App from './App.vue';

import './assets/styles/tailwind.css';
import store from './store';
import keepInViewPortDirective from './utils/keepInViewportDirective.js';
import axios from 'axios';
const http = axios.create({
  baseUrl: process.env.VUE_APP_SERVER,
  timeout: 1000 * 30,
  
});

const app = createApp(App)
  .use(store)
  .use(router);

app.directive('keepInViewport', keepInViewPortDirective);

app.config.globalProperties.$http = http;

app.mount('#app');
