import axios from 'axios';
import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import Login from '../views/Login.vue';
import UserArea from '../views/UserArea.vue';
import Protected from '../views/Protected.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
  },
  {
    path: '/protected',
    name: 'Protected',
    component: Protected,
  },
  {
    path: '/user-area',
    name: 'UserArea',
    component: UserArea,
    props: { default: true },
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/about',
    name: 'About',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/About.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

// eslint-disable-next-line no-unused-vars
router.beforeEach(async (to, from, next) => {
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    try {
      const response = await axios.get(process.env.VUE_APP_SERVER + '/user-auth', { withCredentials: true });
      console.log('response.data: ', response.data);
      if (response.data.user) {
        console.log('Authorized!');
      } else {
        console.log('Session not found!');
        // this.$router.push({ name: 'Login' });
        console.log('response: ', response);
        // this.$router.push({ name: 'UserArea' });
      }
    } catch (err) {
      console.log(err);
    }
  }
  next()
});

export default router;
