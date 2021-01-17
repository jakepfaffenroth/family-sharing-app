import http from './http';

export default () => {
  http.get('/logout');
  document.cookie =
    'ownerId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;Secure';
  document.cookie =
    'guestId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;Secure';
  document.cookie =
    'connect.sid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;Secure';
  window.location.replace(`${process.env.VUE_APP_SERVER}/login`);
};
