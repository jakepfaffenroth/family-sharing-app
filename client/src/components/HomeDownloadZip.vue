<script>
import JSZip from 'jszip';
import axios from 'axios';
import { saveAs } from 'file-saver';
import path from 'path';

import { ref, inject } from 'vue';

export default {
  setup() {
    const toast = inject('toast');
    let images = inject('images').value;
    const downloadProgress = ref(null);

    const download = async () => {
      console.log('test in downloadZip');
      if (!images || images.length === 0) {
        return;
      }

      const zipSizeLimit = 1048576 * 500; // 500 MB limit
      let zipSize = 0;

      let keepZipping = true;
      const zipToast = toast.open({
        type: 'info',
        duration: 0,
        // dismissible: true,
        message:
          '<div id="toast-message"><p id="msg-text"></p><div class="flex justify-end mt-2"><button id="zip-cancel-btn">Cancel</button></div></div>'
      });

      try {
        const zipMsg = document.getElementById('msg-text');
        const zipCancelBtn = document.getElementById('zip-cancel-btn');
        zipCancelBtn.addEventListener('click', () => {
          cancelZip();
        });

        // Begin download and zipping files
        const initZip = () => new JSZip();
        let zip = initZip();
        const count = await zipImages();
        finishZip(count);

        // ------------------ //
        async function zipImages() {
          try {
            let count = 1;
            let folder = createFolder(count);

            for (const file of images) {
              if (keepZipping === false) {
                return (count = 0);
              }
              zipMsg.innerText = `Preparing file ${images.indexOf(file)} of ${
                images.length
              }`;
              // downloadProgress.value = `Downloading file ${images.indexOf(
              //   file
              // )} of ${images.length}`;
              const response = await axios.get(
                `https://cdn.jakepfaf.dev/file/JFP001/${escape(file.fileName)}`,
                {
                  responseType: 'blob',
                  encoding: null
                }
              );
              // Check if zip file will exceed size limit by adding latest downloaded file
              if (zipSize + response.data.size < zipSizeLimit) {
                // Will not exceed limit; add file to zip and continue
                folder.file(path.basename(file.fileName), response.data);
                zipSize += response.data.size;
              } else {
                // Adding file exceeds limit; Write zip, create new, add file to new zip and continue
                zipSize = 0;
                finishZip(count);
                count++;
                zip = startZip();
                folder = createFolder(count);
                folder.file(
                  file.fileName.slice(file.fileName.indexOf('/')),
                  response.data
                );
              }
            }
            return count;
          } catch (err) {
            console.log(err);
          }
        }

        function createFolder(count) {
          // Folder name includes 'part N'
          return zip.folder(`images${count === 1 ? '' : ` part${count}`}`);
        }

        function finishZip(count) {
          if (count === 0) {
            return;
          }
          zip
            .generateInternalStream({
              type: 'blob',
              streamFiles: true,
              compression: 'DEFLATE',
              compressionOptions: {
                level: 6
              }
            })
            .accumulate(metadata => {
              if (keepZipping === false) {
                return;
              }
              zipMsg.innerText = `Preparing download: ${metadata.percent.toFixed()}%`;
            })
            .then(data => {
              if (keepZipping === false) {
                return;
              }
              saveAs(data, `images${count === 1 ? '' : ` part${count}`}.zip`);
              downloadProgress.value = null;
              zipMsg.innerText = 'Complete';
              setTimeout(() => {
                toast.dismiss(zipToast);
              }, 2000);
            });
        }

        function cancelZip() {
          keepZipping = false;
          const toastMessage = document.getElementById('toast-message');
          toastMessage.innerText = 'Download cancelled';
          setTimeout(() => {
            toast.dismiss(zipToast);
          }, 2000);
        }
      } catch (err) {
        const toastMessage = document.getElementById('toast-message');
        toastMessage.innerText = 'An error occurred while downloading images';
        setTimeout(() => {
          toast.dismiss(zipToast);
        }, 3000);
        console.log('error downloading zip file:', err);
      }
    };

    return {
      // images,
      downloadProgress,
      download
    };
  }
};
</script>
