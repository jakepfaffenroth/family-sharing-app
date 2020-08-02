<template>
  <button @click="downloadZip">Download Images</button>
</template>

<script>
import JSZip from 'jszip';
import axios from 'axios';
import { saveAs } from 'file-saver';

export default {
  props: { images: Array },
  methods: {
    async downloadZip() {
      console.log('typeof this.images: ', this.images);
      const zip = new JSZip();
      const imgZip = zip.folder('images');
      for(const file of this.images){
      const response = await axios.get(
        'https://cdn.jakepfaf.dev/file/JFP001/' + file.fileName,
        { responseType: 'blob', encoding: null }
      );
      imgZip.file(file.fileName.slice(file.fileName.indexOf('/')), response.data);
      }
      zip.generateAsync({ type: 'blob' }).then(function(content) {
        saveAs(content, 'images.zip');
      });
    },
  },
};
</script>

<style></style>
