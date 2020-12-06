import { createApp } from 'vue';
import router from './router';
import App from './App.vue';

import 'tailwindcss/tailwind.css';
import store from './store';

const app = createApp(App).use(store);

app.use(router);

app.mount('#app');
