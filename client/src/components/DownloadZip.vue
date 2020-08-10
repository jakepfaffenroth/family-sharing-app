<template>
  <button @click="downloadZip" style="display:inline-block;">Download Zip File</button>
  <p v-if="downloadProgress" style="display:inline-block; margin: 0;">{{ downloadProgress }}</p>
</template>

<script>
import JSZip from 'jszip';
import axios from 'axios';
import { saveAs } from 'file-saver';
import path from 'path'

export default {
  props: { images: Array },
  data() {
    return {
      downloadProgress: null,
    };
  },
  methods: {
    async downloadZip() {
      console.time()
      const zipSizeLimit = 1048576*500; // 500 MB limit
      // const zipSizeLimit = 1048576; // 1 MB limit for testing
      let zipSize = 0;
      let count = 1;

      const startZip = () => {
        return new JSZip();
      };

      const createFolder = () => {
        return zip.folder(`images${count === 1 ? '' : ' part' + count}`);
      };

      const finishZip = (count) => {
        zip
          .generateInternalStream({
            type: 'blob',
            streamFiles: true,
            compression: 'DEFLATE',
            compressionOptions: {
              level: 6,
            },
          })
          .accumulate((metadata) => {
            this.downloadProgress = `Creating Zip file: ${metadata.percent.toFixed()}%`;
          })
          .then((data) => {
            console.log('data: ', data);
            saveAs(data, `images${count === 1 ? '' : ' part' + count}.zip`);
            this.downloadProgress = null;
          });
      };

      // Begin download and zipping files
      let zip = startZip();
      let imgZip = createFolder();
      for (const file of this.images) {
        this.downloadProgress = `Downloading file ${this.images.indexOf(file)} of ${this.images.length}`;
        const response = await axios.get('https://cdn.jakepfaf.dev/file/JFP001/' + file.fileName, {
          responseType: 'blob',
          encoding: null,
        });
        // Check if zip file will exceed size limit by adding latest downloaded file
        if (zipSize + response.data.size < zipSizeLimit) {
          // Will not exceed limit; add file to zip and continue
          imgZip.file(path.basename(file.fileName), response.data);
          zipSize += response.data.size;
        } else {
          // Adding file exceeds limit; Write zip, create new, add file to new zip and continue
          zipSize = 0;
          finishZip(count);
          count++;
          zip = startZip();
          imgZip = createFolder();
          imgZip.file(file.fileName.slice(file.fileName.indexOf('/')), response.data);
        }
      }
      finishZip(count);
      console.timeEnd()
    },
  },
};
</script>

<style></style>
