import { expect, should } from 'chai';
should();
import store from '@/store';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
const mockAxios = new MockAdapter(axios);

process.env.VUE_APP_SERVER = 'http://localhost:3400';

test('remove from images', () => {
  store.state.imageStore.images = [{ fileId: 1 }, { fileId: 2 }, { fileId: 3 }];
  expect(store.state.imageStore.images.length).to.equal(3);

  store.dispatch('removeFromImages', { fileId: 2 });

  expect(store.state.imageStore.images.length).to.equal(2);
});

test('add to images', () => {
  store.state.imageStore.images = [{ fileId: 1 }, { fileId: 2 }, { fileId: 3 }];
  expect(store.state.imageStore.images.length).to.equal(3);

  store.dispatch('addToImages', { fileId: 'mock' });

  expect(store.state.imageStore.images.length).to.equal(4);
});

test('nuke images', () => {
  store.state.imageStore.images = [{ fileId: 1 }, { fileId: 2 }, { fileId: 3 }];
  expect(store.state.imageStore.images.length).to.equal(3);

  store.dispatch('nukeImages');

  expect(store.state.imageStore.images.length).to.equal(0);
});
