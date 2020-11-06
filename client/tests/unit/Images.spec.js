const jestExpect = global.expect;
import { expect, should } from 'chai';
should();
import { flushPromises, mount } from '@vue/test-utils';
import App from '@/App';
import downloadZip from '@/utils/downloadZip';
import FileSaver from 'file-saver';
import { nextTick } from 'vue';
import { Notyf } from 'notyf';
import format from 'date-fns/format';
import {
  setMountOptions,
  store,
  resetStore,
  router,
  mockAxios,
  setCookies
} from '../setup/jest.setup.js';

describe('images update in display', () => {
  let wrapper;

  beforeEach(async () => {
    setCookies();
    router.push('/');
    await router.isReady();
    wrapper = mount(App, setMountOptions());
    await store.dispatch('getOwnerData', {
      ownerId: 'mockOwnerId',
      userType: 'owner'
    });
    await nextTick();
  });

  afterEach(async () => {
    resetStore();
    // await router.replace('/');
    // await router.isReady();
    wrapper.unmount();
    jest.resetModules();
    jest.clearAllMocks();
    // mockAxios.reset();
    // store.state.imageStore.images = [
    //   { fileId: '1', uploadTime: Date.now().toString() },
    //   { fileId: '2', uploadTime: Date.now().toString() }
    // ];
  });

  test('"All" gallery displays if images exist', async () => {
    // console.log('wrapper.html():', wrapper.html());
    expect(wrapper.find('[data-test="albumGallery_All"]').exists()).to.be.true;
  });

  test('displays new image after adding to state', async () => {
    store.state.imageStore.images.push({
      uploadTime: Date.now().toString(),
      src: 'newImg',
      thumbnail: 'newImg'
    });
    await nextTick();
    expect(wrapper.find('[src="newImg"]').exists()).to.be.true;
  });

  test('delete confirmation modal displays', async () => {
    store.state.imageStore.images.push({
      uploadTime: Date.now().toString(),
      src: 'newImg',
      thumbnail: 'newImg'
    });

    await nextTick();
    await wrapper.find('[src="newImg"]').trigger('hover');
    await wrapper.find('[data-test="imgDeleteBtn"]').trigger('click');

    expect(wrapper.find('[data-test="homeModal"]').text()).to.include(
      'Are you sure you want to delete this image?'
    );
  });

  test('removes image from display after removing from state', async () => {
    store.dispatch('addToImages', {
      uploadTime: Date.now().toString(),
      src: 'newImg',
      thumbnail: 'newImg'
    });
    const index = store.state.imageStore.images.findIndex(
      x => x.src === 'newImg'
    );

    await nextTick();
    expect(wrapper.find('[src="newImg"]').exists()).to.be.true;
    store.state.imageStore.images.splice(index, 1);
    await nextTick();

    expect(wrapper.find('[src="newImg"]').exists()).to.be.false;
  });

  test('removes image from display after deletion', async () => {
    store.state.imageStore.images.push({
      fileId: '3',
      uploadTime: Date.now().toString(),
      src: 'newImg',
      thumbnail: 'newImg'
    });

    await nextTick();
    expect(wrapper.find('[src="newImg"]').exists()).to.be.true;

    await wrapper.find('[src="newImg"]').trigger('hover');
    await wrapper
      .find('[src="newImg"]')
      .find('[data-test="imgDeleteBtn"]')
      .trigger('click');
    await wrapper.find('[data-test="confirmDeleteBtn"]').trigger('click');
    await flushPromises();

    expect(wrapper.find('[src="newImg"]').exists()).to.be.false;
  });
});

describe('group images by date', () => {
  let wrapper;

  beforeEach(async () => {
    store.dispatch('nukeImages');
    setCookies();
    router.push('/');
    await router.isReady();
    // store.state.imageStore.images = [];
    wrapper = mount(App, setMountOptions());
  });

  afterEach(async () => {
    resetStore();
    // await router.replace('/');
    // await router.isReady();
    wrapper.unmount();
    jest.resetModules();
    jest.clearAllMocks();
    // mockAxios.reset();
  });

  test.each([
    [[new Date(Date.now()), new Date(Date.now())]],
    [[new Date(Date.now()), new Date('1/21/2000')]],
    [
      [
        new Date('1/21/2000'),
        new Date('1/21/2000'),
        new Date('5/13/2005'),
        new Date('5/13/2005'),
        new Date('9/26/1986')
      ]
    ],
    [[null, null]],
    [[new Date('1/21/2000'), new Date('1/21/2000'), null]],
    [[null, new Date('1/21/2000'), new Date('1/21/2050')]]
  ])('images should be grouped by date', async dates => {
    dates.forEach(date => {
      store.dispatch('addToImages', {
        exif: date ? { exif: { DateTimeOriginal: date.toLocaleString() } } : {},
        uploadTime: Date.now().toString(),
        src: 'mockUrl',
        fileId: dates.indexOf(date) // just so each img has a unique fileId
      });
    });
    await nextTick();

    dates.forEach(date => {
      expect(wrapper.text()).to.include(
        format(date || new Date(Date.now()), 'E, LLL d')
      );
    });
  });

  test.each([
    [[new Date(Date.now()), new Date(Date.now())]],
    [[new Date(Date.now()), new Date('1/21/2000')]],
    [
      [
        new Date('1/21/2000'),
        new Date('1/21/2000'),
        new Date('5/13/2005'),
        new Date('5/13/2005'),
        new Date('9/26/1986')
      ]
    ],
    [[null, null]],
    [[new Date('1/21/2000'), new Date('1/21/2000'), null]],
    [[null, new Date('1/21/2000'), new Date('1/21/2050')]]
  ])('show correct number of img groups', async dates => {
    dates.forEach(date => {
      store.dispatch('addToImages', {
        exif: date ? { exif: { DateTimeOriginal: date.toLocaleString() } } : {},
        uploadTime: Date.now().toString(),
        src: 'mockUrl',
        fileId: dates.indexOf(date) // just so each img has a unique fileId
      });
      dates[dates.indexOf(date)] = date ? date.toString() : date;
    });
    const uniqueGroups = dates.filter(
      (date, index, arr) => arr.indexOf(date) === index
    );

    await nextTick();
    const imgGroups = wrapper.findAll('[data-test="imgGroup"]');

    expect(imgGroups.length).to.equal(uniqueGroups.length);
  });
});

describe('albums', () => {
  let wrapper;

  const images = [
    {
      fileId: 0,
      src: 'mockUrl',
      albumId: 1,
      uploadTime: Date.now().toString(),
      exif: {}
    },
    {
      fileId: 1,
      src: 'mockUrl',
      albumId: 2,
      uploadTime: Date.now().toString(),
      exif: {}
    },
    {
      fileId: 2,
      src: 'mockUrl',
      albumId: 1,
      uploadTime: Date.now().toString(),
      exif: {}
    },
    {
      fileId: 3,
      src: 'mockUrl',
      albumId: 2,
      uploadTime: Date.now().toString(),
      exif: {}
    },
    {
      fileId: 4,
      src: 'mockUrl',
      albumId: 3,
      uploadTime: Date.now().toString(),
      exif: {}
    }
  ];

  beforeEach(async () => {
    setCookies();
    router.push('/');
    await router.isReady();
    wrapper = mount(
      App,
      setMountOptions({ stubs: { HomeMenuOwner: true, HomeUploader: true } })
    );
    await store.dispatch('getOwnerData', {
      ownerIs: 'mockOwnerId',
      userType: 'owner'
    });
    await nextTick();
  });

  afterEach(async () => {
    resetStore();
    wrapper.unmount();
    jest.resetModules();
    jest.clearAllMocks();
    // mockAxios.reset();
  });

  test('album tabs display on homepage', async () => {
    await nextTick();
    expect(wrapper.text()).to.include('mockAlbum1');
    expect(wrapper.text()).to.include('mockAlbum2');
  });

  test.each([
    { albumId: 1, albumName: 'mockAlbum1' },
    { albumId: 2, albumName: 'mockAlbum2' }
  ])('images display in correct albums', async album => {
    const uniqueImages = images.filter(
      (x, index, arr) => x.albumId === album.albumId
    );
    const visibleImages = [];

    await wrapper
      .find('[data-test="albumTab_' + album.albumName + '"]')
      .trigger('click');
    await nextTick();
    wrapper.findAll('[src="mockUrl"]').forEach(img => {
      if (img.isVisible()) {
        visibleImages.push(img);
      }
    });

    expect(visibleImages.length).to.equal(uniqueImages.length);
  });
});

describe('download images', () => {
  let wrapper;
  // let mockImage;

  const mockImage = new Blob(
    // Math.pow(123456789123456789, 10000)
    //   .toString()
    //   .split(''),
    ['1', '2', '3'],
    {
      type: 'image/jpeg'
    }
  );

  // mockImage['name'] = 'mockImage.jpg';

  beforeEach(async () => {
    setCookies();
    router.push('/');
    await router.isReady();
    wrapper = mount(App, setMountOptions());
  });

  afterEach(async () => {
    resetStore();
    wrapper.unmount();
    jest.resetModules();
    jest.clearAllMocks();
    // mockAxios.reset();
    store.state.imageStore.images = [
      { fileId: '1', uploadTime: Date.now().toString(), exif: {} },
      { fileId: '2', uploadTime: Date.now().toString(), exif: {} }
    ];
  });

  test.skip('downloads zip file', async () => {
    // TODO - Fix this test
    // await toDataURL('../assets/mockImage.jpg', function(dataURL) {
    //   // do something with dataURL
    //   mockImage = dataURL;
    // });
    // console.log('mockImage:', mockImage);
    jest.mock('notyf');
    const toast = new Notyf();

    jest.mock('file-saver', () => ({ saveAs: jest.fn() }));
    // jest.mock(saveAs);
    // const mockSaveAs = jest.spyOn(FileSaver, 'saveAs');
    // FileSaver.saveAs(mockImage, 'mockImage.jpg');
    // jestExpect(saveAs).toHaveBeenCalled();
    await downloadZip([{ fileName: 'mockImage.jpg' }], toast);
    // setTimeout(() => {
    jestExpect(FileSaver.saveAs).toHaveReturnedWith('horse');
    // jestExpect(FileSaver.saveAs).toHaveBeenCalledWith('horse');
    // }, 100);
  });
});
