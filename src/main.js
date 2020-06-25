import Vue from 'vue';
import App from './App.vue';
import vueCookie from 'vue-cookie';

Vue.use(vueCookie);

Vue.config.productionTip = false;

new Vue({
  render: (h) => h(App),
}).$mount('#app');
