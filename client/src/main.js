import Vue from 'vue';
import App from './App.vue';
import vueCookies from 'vue-cookies';
import VueSilentbox from 'vue-silentbox';

Vue.use(vueCookies);
Vue.use(VueSilentbox);

Vue.config.productionTip = false;

new Vue({
  render: (h) => h(App),
}).$mount('#app');
