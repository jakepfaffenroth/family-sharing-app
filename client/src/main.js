import Vue from 'vue';
import App from './App.vue';
import vueCookies from 'vue-cookies';

Vue.use(vueCookies);

Vue.config.productionTip = false;

new Vue({
  render: (h) => h(App),
}).$mount('#app');
