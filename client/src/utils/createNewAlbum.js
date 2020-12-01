import axios from 'axios';

export default async (body, albums) => {
  const server = process.env.VUE_APP_SERVER;

  if (albums.find(x => x.albumName === body.name)) {
    return false;
  }
  try {
    return await axios.post(server + '/albums/create-album', body);
    if (response.status === 200) {
      store.dispatch('addNewAlbum', response.data);
      setActiveGallery(newAlbumName);
      closeModal();
      toast.success('Album created');
    } else {
      toast.error('An error occurred while creating the album');
    }
  } catch (err) {
    console.error(err);
  }
};
