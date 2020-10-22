import axios from 'axios';
const server = process.env.VUE_APP_SERVER;

export default () => {
  axios.get(`${server}/logout`);
  document.cookie =
    'ownerId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;Secure';
  document.cookie =
    'connect.sid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;Secure';
  window.location.replace(`${server}/login`);
};
