import http from './http';
import toast from './Toast';

function pushImgAlbumPairs(imgInfo, album, ownerId) {
  let imgAlbumPairs = [];
  imgInfo.forEach(img => {
    imgAlbumPairs.push({
      // Must be snake case for easier SQL query assembly
      file_id: img.fileId,
      album_id: album.albumId,
      owner_id: ownerId
    });
  });
  return imgAlbumPairs;
}

export async function addToAlbum(imgInfo, album, ownerId, store) {
  if (imgInfo.length > 0 || imgInfo) {
    const imgsToAdd = pushImgAlbumPairs(imgInfo, album, ownerId);
    // Send array of fileIds and albumIds to server to be added to DB
    try {
      const response = await http.post('/albums/add-image', {
        ownerId,
        imgsToAdd
      });

      if (response.status === 200 && response.data.length === 0) {
        toast.open({
          type: 'info',
          duration: 3000,
          dismissible: true,
          message: 'Image is already in that album'
        });
      } else if (response.status === 200) {
        store.dispatch('updateImages', response.data);
        toast.success(`Image${imgInfo.length ? 's' : ''} added to album`);
      } else throw Error('An error occured');
    } catch (err) {
      console.error(err);
    }
  } else {
    console.error('oops');
  }
}

export async function removeFromAlbum(imgInfo, album, ownerId, store) {
  if (imgInfo.length > 0 || imgInfo) {
    const imgsToRemove = pushImgAlbumPairs(imgInfo, album, ownerId);
    // Send array of fileIds and albumIds to server to be removed from DB
    try {
      const response = await http.post('/albums/remove-image', {
        ownerId,
        imgsToRemove
      });

      if (response.status === 200 && response.data.length === 0) {
        toast.open({
          type: 'info',
          duration: 3000,
          dismissible: true,
          message: 'Image is already in that album'
        });
      } else if (response.status === 200) {
        store.dispatch('updateImages', response.data);
        toast.success(`Image${imgInfo.length ? 's' : ''} removed from album`);
      } else throw Error('An error occured');
    } catch (err) {
      console.error(err);
    }
  } else {
    console.error('oops');
  }
}
