import http from './http';

export default async (body, albums) => {
  if (albums.find(x => x.albumName === body.name)) {
    return false;
  }
  try {
    return await http.post('/albums/create-album', body);
  } catch (err) {
    console.error(err);
  }
};
