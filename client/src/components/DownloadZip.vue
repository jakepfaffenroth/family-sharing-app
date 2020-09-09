<template>
  <button
    v-if="images.length > 0"
    style="display:inline-block;"
    @click="downloadZip"
  >
    Download Zip File
  </button>
  <p v-if="downloadProgress" style="display:inline-block; margin: 0;">
    {{ downloadProgress }}
  </p>
</template>

<script>
import JSZip from 'jszip';
import axios from 'axios';
import { saveAs } from 'file-saver';
import path from 'path';

import { ref, inject } from 'vue';

export default {
  setup() {
    const images = inject('images').value;
    const downloadProgress = ref(null);

    const downloadZip = async () => {
      if (!images || images.length === 0) {
        return;
      }

      try {
        console.time();
        const zipSizeLimit = 1048576 * 500; // 500 MB limit
        let zipSize = 0;
        let count = 1;

        const startZip = () => new JSZip();

        const createFolder = () =>
          zip.folder(`images${count === 1 ? '' : ` part${count}`}`);

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
              downloadProgress.value = `Creating zip file: ${metadata.percent.toFixed()}%`;
            })
            .then((data) => {
              saveAs(data, `images${count === 1 ? '' : ` part${count}`}.zip`);
              downloadProgress.value = null;
            });
        };

        // Begin download and zipping files
        let zip = startZip();
        let imgZip = createFolder();
        for (const file of images) {
          downloadProgress.value = `Downloading file ${images.indexOf(
            file
          )} of ${images.length}`;
          const response = await axios.get(
            `https://cdn.jakepfaf.dev/file/JFP001/${file.fileName}`,
            {
              responseType: 'blob',
              encoding: null,
            }
          );
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
            imgZip.file(
              file.fileName.slice(file.fileName.indexOf('/')),
              response.data
            );
          }
        }
        finishZip(count);
        console.timeEnd();
      } catch (err) {
        console.log('error downloading zip file:', err);
      }
    };

    return {
      images,
      downloadProgress,
      downloadZip,
    };
  },
};
</script>

<style></style>
