process.env.VUE_APP_SERVER = 'http://localhost:3400';

//  Vue Router
import Home from '@/views/Home';
import Account from '@/views/Account';
import { createRouter, createWebHistory } from 'vue-router';
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      name: 'home',
      path: '/',
      component: Home,
      props: true
    },
    {
      name: 'account',
      path: '/account',
      component: Account,
      props: true
    }
  ]
});

// Vuex
import store from '@/store';


const initialState = JSON.parse(JSON.stringify(store.state));
function resetStore() {
  store.replaceState(initialState);
}

// Default mount options
import setMountOptions from './mountOptions.setup'

// Axios mocks
import mockAxios from './mockAxios.setup';

// Misc
jest.mock('reconnecting-websocket');
jest.mock('@uppy/dashboard');
const setCookies = () => {
  Object.defineProperty(window.document, 'cookie', {
    writable: true,
    value: 'ownerId=mockOwnerId'
  });
};
const oldLocation = { ...window.location };
Object.defineProperty(window, 'location', {
  value: {
    ...oldLocation,
    assign: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
    search: jest.fn()
  },
  writable: true
});
Object.defineProperty(window, 'history', {
  value: {
    replaceState: jest.fn()
  },
  writable: true
});
Object.defineProperty(window, 'scrollTo', {
  value: jest.fn(),
  writable: true
});


export { setMountOptions, router, store, resetStore, mockAxios, setCookies };
