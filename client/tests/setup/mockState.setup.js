const owner = {
  ownerId: 'mockOwnerId',
  username: 'alice',
  firstName: 'Alice',
  lastName: 'Doe',
  guestId: 'mockGuestId',
  plan: 'Basic',
  quota: 2000
};
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
const albums = [
  { albumId: 1, albumName: 'mockAlbum1' },
  { albumId: 2, albumName: 'mockAlbum2' }
];

export { owner, images, albums };
