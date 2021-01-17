import axios from 'axios';

const http = axios.create({
  baseURL: process.env.VUE_APP_SERVER,
  timeout: 1000 * 15
});

export function addInterceptor({ demoToast }) {
  http.interceptors.response.use(
    response => {
      if (response.data.demo) {
        demoToast();
      }
      return response;
    },
    err => {
      return Promise.reject(err);
    }
  );
}

export default http;
