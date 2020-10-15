import { createRouter, createWebHistory } from 'vue-router';

const Home = () => import('../views/Home.vue');
// import Account from '../views/Account.vue';
const Account = () => import('../views/Account');
const AccountSummary = () => import('../views/AccountSummary');
const ChangePlan = () => import('../views/ChangePlan');

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home,
    props: true
  },
  {
    path: '/account/:ownerId',
    name: 'account',
    component: Account,
    props: true,
    children: [
      // {
      //   path: '/',
      //   component: AccountSummary,
      //   props: true
      // },
      {
        path: 'change-plan',
        component: ChangePlan,
        props: true
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
  // scrollBehavior(to, from, savedPosition) {
  //   // always scroll to top
  //   return { top: 0, behavior: 'smooth' };
  // }
});

export default router;
