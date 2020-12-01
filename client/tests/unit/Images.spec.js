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
    store.dispatch('RESET_STATE');
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
    expect(wrapper.find('[data-test="albumGallery-All"]').exists()).to.be.true;
  });

  test('displays new image after adding to state', async () => {
    store.dispatch('addToImages', {
      uploadTime: Date.now().toString(),
      src: 'newImg',
      thumbnail: 'newImg'
    });
    await nextTick();
    expect(wrapper.find('[src="newImg"]').exists()).to.be.true;
  });

  test('delete confirmation modal displays', async () => {
    store.dispatch('addToImages', {
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
    store.dispatch('addToImages', {
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
    store.dispatch('RESET_STATE');
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
    store.dispatch('nukeImages');
    const uploadTime = Date.now();
    dates.forEach(date => {
      store.dispatch('addToImages', {
        exif: date ? { exif: { DateTimeOriginal: date.toLocaleString() } } : {},
        uploadTime: uploadTime.toString(),
        src: 'mockUrl',
        fileId: dates.indexOf(date) // just so each img has a unique fileId
      });
    });
    await nextTick();
    expect(wrapper.find('[data-test="gallerySkeleton"]').exists()).to.be.false;
    dates.forEach(date => {
      expect(wrapper.text()).to.include(
        format(date || new Date(uploadTime), 'E, LLL d')
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
    store.dispatch('nukeImages');
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
      src: 'mockUrl0',
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
    store.dispatch('RESET_STATE');
    wrapper.unmount();
    jest.resetModules();
    jest.clearAllMocks();
    // mockAxios.reset();
  });

  describe('album ui', () => {
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
        .find('[data-test="albumTab-' + album.albumName + '"]')
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

  describe('album user actions', () => {
    test('img album btn opens album picker', async () => {
      store.dispatch('addToImages', {
        fileId: '100',
        uploadTime: Date.now().toString(),
        src: 'newImg',
        thumbnail: 'newImg'
      });

      await nextTick();
      expect(wrapper.find('[src="newImg"]').exists()).to.be.true;

      await wrapper.find('[src="newImg"]').trigger('hover');
      await wrapper
        .find('[src="newImg"]')
        .find('[data-test="addToAlbumBtn"]')
        .trigger('click');
      await nextTick();

      expect(wrapper.find('[data-test="homeModal"]').isVisible()).to.be.true;
      expect(wrapper.find('[data-test="homeModal"]').text()).to.include(
        'Albums'
      );
    });

    test('checking album checkbox adds album to selectedAlbums', async () => {
      const home = wrapper.findComponent({ name: 'Home' });
      home.vm.imgInfo = {
        fileId: 0,
        src: 'mockUrl0',
        albumId: 1,
        uploadTime: Date.now().toString(),
        exif: {}
      };
      home.vm.visibleModal = 'HomeModalAlbumPicker';
      await nextTick();
      expect(
        wrapper
          .find('[data-test="albumCheckbox-1"]')
          .attributes('data-test-checked')
      ).to.be.ok;
    });

    test('albumPicker shows which albums the clicked image belongs to', async () => {
      await store.dispatch('addToImages', {
        fileId: 0,
        src: 'mockUrl0',
        albumId: 2,
        uploadTime: Date.now().toString(),
        exif: {}
      });

      await wrapper
        .find('[id="image-0"]')
        .find('[data-test="imgMenuBtn"]')
        .trigger('click');
      await nextTick();
      await wrapper.find('[data-test="addToAlbumBtn"]').trigger('click');
      await nextTick();

      expect(
        wrapper
          .find('[data-test="albumCheckbox-1"]')
          .attributes('data-test-checked')
      ).to.be.ok;
      expect(
        wrapper
          .find('[data-test="albumCheckbox-2"]')
          .attributes('data-test-checked')
      ).to.be.ok;
    });
  });

  describe('album backend', () => {
    beforeEach(async () => {});

    test('adding img to album updates album gallery', async () => {
      store.dispatch('addToImages', {
        fileId: '100',
        uploadTime: Date.now().toString(),
        src: 'newImg',
        thumbnail: 'newImg'
      });
      store.dispatch('updateAlbums', [
        {
          albumId: 100,
          albumName: 'mockAlbum',
          ownerId: 'mockOwnerId'
        }
      ]);
      await nextTick();
      await wrapper.find('[src="newImg"]').trigger('hover');
      await wrapper
        .find('[src="newImg"]')
        .find('[data-test="addToAlbumBtn"]')
        .trigger('click');
      await nextTick();

      await wrapper.find('[data-test="albumCheckbox-100"]').trigger('click');
      await wrapper.find('[data-test="albumSaveBtn"]').trigger('click');
      await nextTick();
      await wrapper.find('[data-test="albumTab-mockAlbum"]').trigger('click');
      await nextTick();

      expect(wrapper.find('[data-test="albumGallery-mockAlbum"]').isVisible())
        .to.be.true;
      expect(wrapper.html()).to.include('newImg');
    });

    test('removing img from album updates album gallery', async () => {
      store.dispatch('addToImages', {
        albumId: 100,
        fileId: 'mockFileId',
        ownerId: 'mockOwnerId',
        src: 'newImg',
        uploadTime: 1,
        exif: {}
      });
      store.dispatch('updateAlbums', [
        {
          albumId: 100,
          albumName: 'mockAlbum',
          ownerId: 'mockOwnerId'
        }
      ]);
      await nextTick();

      await wrapper.find('[src="newImg"]').trigger('hover');
      await wrapper
        .find('[src="newImg"]')
        .find('[data-test="addToAlbumBtn"]')
        .trigger('click');
      await nextTick();

      await wrapper.find('[data-test="albumCheckbox-100"]').trigger('click');
      await wrapper.find('[data-test="albumSaveBtn"]').trigger('click');
      await nextTick();
      await wrapper.find('[data-test="albumTab-mockAlbum"]').trigger('click');
      await nextTick();

      expect(wrapper.find('[data-test="albumGallery-mockAlbum"]').isVisible())
        .to.be.true;

      expect(
        wrapper.find('[data-test="albumGallery-mockAlbum"]').html()
      ).to.not.include('newImg');
    });
  });
});

describe('selecting images', () => {
  let wrapper;

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
    // store.dispatch('RESET_STATE');
    store.dispatch('RESET_STATE');
    // console.log(
    //   'after reset:',
    //   store.getters.selectedImages
    // );
    wrapper.unmount();
    jest.resetModules();
    jest.clearAllMocks();
    // mockAxios.reset();
  });

  test('entering Select Mode shows img select btns', async () => {
    await wrapper.find('[data-test="selectModeBtn"]').trigger('click');
    await nextTick();

    expect(wrapper.find('[data-test="imgSelectBtn"]').isVisible()).to.be.true;
  });

  test('cancelling Select Mode hides select buttons', async () => {
    const homeVm = wrapper.getComponent({ name: 'Home' }).vm;
    homeVm.isSelectMode = true;
    await nextTick();

    await wrapper.find('[data-test="selectModeBtn"]').trigger('click');
    await nextTick();

    expect(wrapper.findComponent({ name: 'SelectButton' }).exists()).to.be
      .false;
    expect(wrapper.find('[data-test="imgMenuBtn"]').exists()).to.be.true;
  });

  test('clicking image select btn adds image to selectedImages array', async () => {
    // console.log(
    //   'store.getters.selectedImages AA:',
    //   store.getters.selectedImages
    // );
    const newImg = {
      fileId: '100',
      uploadTime: Date.now().toString(),
      src: 'newImg',
      thumbnail: 'newImg'
    };
    store.dispatch('addToImages', newImg);
    await nextTick();

    await wrapper.find('[data-test="selectModeBtn"]').trigger('click');
    await nextTick();
    await wrapper
      .find('[src="newImg"]')
      .find('[data-test="imgSelectBtn"]')
      .trigger('click');
    await nextTick();
    // console.log('store.getters.selectedImages:', store.getters.selectedImages);
    // const selectedImages = wrapper.getComponent({ name: 'Home' }).vm
    // .selectedImages;
    expect(store.getters.selectedImages.find(x => x.fileId === newImg.fileId))
      .to.be.ok;
    expect(store.getters.selectedImages.length).to.equal(1);
    // expect(selectedImages.find(x => x.fileId === newImg.fileId)).to.be.ok;
  });

  test('clicking image select btn on selected image removes it from selectedImages array', async () => {
    // console.log('store.state.imageStore:', store.state.imageStore);
    const newImg = {
      fileId: '101',
      uploadTime: Date.now().toString(),
      src: 'newImg',
      thumbnail: 'newImg'
    };
    // console.log('store.getters.selectedImages XX:', store.getters.selectedImages);
    const homeVm = wrapper.getComponent({ name: 'Home' }).vm;
    store.dispatch('addToImages', newImg);
    store.dispatch('addToSelectedImages', newImg);
    expect(store.getters.selectedImages.find(x => x.fileId === newImg.fileId))
      .to.be.ok;
    // homeVm.selectedImages.push(newImg);
    homeVm.isSelectMode = true;
    await nextTick();

    // console.log('store.getters.selectedImages:', store.getters.selectedImages);
    await wrapper
      .find('[src="newImg"]')
      .find('[data-test="imgSelectBtn"]')
      .trigger('click');
    await nextTick();
    // console.log('store.getters.selectedImages:', store.getters.selectedImages);
    expect(store.getters.selectedImages.find(x => x.fileId === newImg.fileId))
      .to.be.not.ok;
    expect(store.getters.selectedImages.length).to.equal(0);
    // expect(homeVm.selectedImages.find(x => x.fileId === newImg.fileId)).to.be
    //   .not.ok;
  });
});

describe('Selection Toolbar', () => {
  let wrapper;

  beforeEach(async () => {
    setCookies();
    router.push('/');
    await router.isReady();
    wrapper = mount(
      App,
      setMountOptions({ stubs: { HomeMenuOwner: true, HomeUploader: true } })
    );
    const homeVm = wrapper.getComponent({ name: 'Home' }).vm;
    // homeVm.isSelectMode = true;
    await store.dispatch('getOwnerData', {
      ownerId: 'mockOwnerId',
      userType: 'owner'
    });
    const newImg = {
      fileId: '100',
      uploadTime: Date.now().toString(),
      src: 'newImg',
      thumbnail: 'newImg'
    };
    await store.dispatch('addToSelectedImages', newImg);
    // homeVm.selectedImages.push(newImg);
    await nextTick();
  });

  afterEach(async () => {
    store.dispatch('RESET_STATE');
    wrapper.unmount();
    jest.resetModules();
    jest.clearAllMocks();
    // mockAxios.reset();
  });

  test('entering Select Mode opens selection toolbar', async () => {
    // wrapper.getComponent({ name: 'Home' }).vm.isSelectMode = false;
    // await nextTick();
    await wrapper.find('[data-test="selectModeBtn"]').trigger('click');
    await nextTick();

    expect(wrapper.findComponent({ name: 'SelectionToolbar' }).exists()).to.be
      .true;
  });

  test('selectAll programmatically selects and deselects all images', async () => {
    await wrapper.find('[data-test="selectModeBtn"]').trigger('click');
    await nextTick();

    const imgSelectBtns = wrapper.findAll(
      '[data-test="imgSelectBtnCheckmark"]'
    );

    await wrapper.find('[data-test="selectToolsSelectAll"]').trigger('click');
    await nextTick();
    imgSelectBtns.forEach(btn => {
      expect(btn.attributes('data-test-selected')).to.equal('true');
    });
    await wrapper.find('[data-test="selectToolsSelectAll"]').trigger('click');
    await nextTick();
    imgSelectBtns.forEach(btn => {
      expect(btn.attributes('data-test-selected')).to.not.be.ok;
    });
  });

  test('clicking Albums with selected images opens albumPicker', async () => {
    await wrapper.find('[data-test="selectModeBtn"]').trigger('click');
    await nextTick();
    await wrapper.find('[data-test="selectToolsAlbums"]').trigger('click');
    await nextTick();

    expect(wrapper.find('[data-test="albumPicker"]').isVisible()).to.be.true;
  });

  test.skip('clicking Share with selected images opens imgShareModal', async () => {
    await wrapper.find('[data-test="selectToolsShare"]').trigger('click');
    await nextTick();
    // TODO - modal hasn't been created yet
    expect(wrapper.find('[data-test="imgShareModal"]').isVisible()).to.be.true;
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
    store.dispatch('RESET_STATE');
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
