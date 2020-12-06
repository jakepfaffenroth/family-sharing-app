import { expect, should } from 'chai';
should();
import store from '@/store';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
const mockAxios = new MockAdapter(axios);

process.env.VUE_APP_SERVER = 'http://localhost:3400';

describe('actions', () => {
  test('NUKE images', () => {
    store.state.imageStore.images = [
      { fileId: 1 },
      { fileId: 2 },
      { fileId: 3 }
    ];
    expect(store.state.imageStore.images.length).to.equal(3);

    store.dispatch('NUKE');

    expect(store.state.imageStore.images.length).to.equal(0);
  });

  test('update images', () => {
    store.state.imageStore.images = [
      { fileId: 1 },
      { fileId: 2 },
      { fileId: 3 }
    ];

    store.dispatch('updateImages', [{ fileId: 4 }]);

    expect(store.state.imageStore.images.length).to.equal(1);
  });

  test('add to images', () => {
    store.state.imageStore.images = [
      { fileId: 1 },
      { fileId: 2 },
      { fileId: 3 }
    ];
    expect(store.state.imageStore.images.length).to.equal(3);

    store.dispatch('addToImages', { fileId: 'mock' });

    expect(store.state.imageStore.images.length).to.equal(4);
  });

  test('remove from images', () => {
    store.state.imageStore.images = [
      { fileId: 1 },
      { fileId: 2 },
      { fileId: 3 }
    ];
    expect(store.state.imageStore.images.length).to.equal(3);

    store.dispatch('removeFromImages', { fileId: 2 });

    expect(store.state.imageStore.images.length).to.equal(2);
  });
});
