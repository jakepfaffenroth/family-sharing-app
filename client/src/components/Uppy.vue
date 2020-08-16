<template>
  <div>
    <button id="uppy-select-files" @click="openUppyModal">Upload Files (Uppy)</button>
    <div id="drop-area"></div>
  </div>
</template>

<script>
import { onMounted } from 'vue';
import Uppy from '@uppy/core';
import Dashboard from '@uppy/dashboard';
import ImageEditor from '@uppy/image-editor';
import xhr from '@uppy/xhr-upload';
// import WebsocketUpload from '../plugins/WebsocketUpload';
// import tus from '@uppy/tus';

import '@uppy/core/dist/style.css';
import '@uppy/dashboard/dist/style.css';

export default {
  props: { user: Object },
  setup(props) {
    // onMounted(() => {
    const uppy = new Uppy({
      meta: {
        userId: props.user.userId,
        guestId: props.user.guestId,
      },
      // logger: Uppy.debugLogger,
      autoProceed: true,
      onBeforeUpload: () => {
        uppy.getPlugin('Dashboard:StatusBar').setOptions({
          hideAfterFinish: false,
          locale: {
            strings: {
              complete: 'Upload complete (You can leave this page)',
            },
          },
        });
      },
    });
    onMounted(() => {
      uppy.use(Dashboard, {
        target: '#drop-area',
        trigger: '#uppy-select-files',
        closeModalOnClickOutside: true,
        theme: 'auto',
        inline: false,
        showProgressDetails: true,
        // hideProgressAfterFinish: false,
        locale: {
          strings: {
            complete: 'Upload complete (You can leave this page)',
          },
        },
      });

      uppy.use(ImageEditor, {
        id: 'ImageEditor',
        target: Dashboard,
        quality: 1,
        cropperOptions: {
          viewMode: 1,
          background: false,
          autoCropArea: 1,
          responsive: true,
        },
      });
      // uppy.use(tus, { endpoint: process.env.VUE_APP_SERVER + '/uploads' });
    });
    uppy.use(xhr, {
      endpoint: process.env.VUE_APP_SERVER + '/files/upload',
      method: 'post',
      responseType: document,
      bundle: true,
      timeout: 0,
    });

    // uppy.use(WebsocketUpload, {
    //   endpoint: 'ws://localhost:3200/files/upload',
    // });

    const openUppyModal = () => {
      uppy.getPlugin('Dashboard').openModal();
    };

    const url = 'ws://localhost:3200';

    const socket = new WebSocket(url);
    uppy.on('file-added', (file) => {
      uppy.setFileMeta(file.id, { uppyFileId: file.id });

      socket.onopen = (ev) => {
        console.log('ev: ', ev);
        socket.send('hey');
      };

      socket.onerror = (error) => {
        console.log(`WebSocket error:`, error);
      };

      socket.onmessage = async (msg) => {
        // ----- TURN OFF STATUS UPDATES ----- //
        // if (msg) return
        // ----------------------------------- //
        const files = uppy.getFiles().map((item) => {
          const newArr = {};
          newArr[item.name] = item.id;
          return newArr;
        });
        console.log('new files array: ', files);
        console.log('StatusBar classes:', document.querySelector('.uppy-StatusBar').classList || null);

        const msgParser = async (msg) => {
          return msg.data instanceof Blob ? JSON.parse(await msg.data.text()) : msg.data;
        };

        let data = await msgParser(msg);

        const getUppyFileId = (data, files) => {
          return files.filter((item) => {
            if (item[data.filename]) return true;
          })[0][data.filename];
        };

        console.log('parsed msg: ', data);
        function getMsg(type, data) {
          const msgTypes = {
            fileUploaded: async () => {
              console.log('File uploaded');
              data.uppyFileId = getUppyFileId(data, files);
              const progress = uppy.getState().files[data.uppyFileId].progress;
              return await uppy.setFileState(data.uppyFileId, {
                meta: { name: data.msg },
                progress: {
                  ...progress,
                  // uploadComplete: true,
                  // percentage: 100,
                },
              });
            },
            // allUploaded: () => {
            //   // uppy.info(msg.data, 'info', 3000);
            //   return uppy.setOptions({
            //     locale: {
            //       strings: {
            //         // uploading: data.,
            //         complete: `Upload complete (You can leave this page)`,
            //       },
            //     },
            //   });
            // },
            statusUpdate: async () => {
              data.uppyFileId = getUppyFileId(data, files);
              return await uppy.setFileState(data.uppyFileId, { meta: { name: data.msg } });
              // return await uppy.setFileState(data.uppyFileId, { meta: { name: data.uppyFileId } });
            },
            fileFinished: async () => {
              data.uppyFileId = getUppyFileId(data, files);
              await uppy.setFileState(data.uppyFileId, { meta: { name: 'Complete' }, complete: true });
              //
              // console.log('state:', await uppy.getState());
              const state = await uppy.getState();
              //
              // console.log('test:', Object.values(state.files));
              // console.log(
              //   'test:',
              //   Object.values(state.files).every((item) => item.complete)
              // );
              //
              if (Object.values(state.files).every((item) => item.complete)) {
                console.log('file state: ', await uppy.getFile(data.uppyFileId));
                await uppy.getPlugin('Dashboard:StatusBar').setOptions({
                  locale: {
                    strings: {
                      complete: 'Complete',
                    },
                  },
                });
              }
              //
              return socket.send('Complete Confirmed');
            },
            default: () => {
              return console.log('Message received:', data);
            },
          };
          return (msgTypes[type] || msgTypes['default'])();
        }

        getMsg(data.type, data);
      };
    });

    // uppy.on('upload', () => {
    //   uppy.getPlugin('Dashboard:StatusBar').setOptions({
    //     hideAfterFinish: false,
    //     locale: {
    //       strings: {
    //         complete: 'Upload complete (You can leave this page)',
    //       },
    //     },
    //   });
    // });

    uppy.on('complete', (result) => {
      // console.log('uppy.getPlugin("Dashboard:StatusBar").opts: ', uppy.getPlugin('Dashboard:StatusBar').opts);
      // uppy.getPlugin('Dashboard:StatusBar').setOptions({
      //   locale: {
      //     strings: {
      //       complete: 'Complete',
      //     },
      //   },
      // });
      console.log('sucessful files:', result.successful);
      console.log('failed files:', result.failed);
      // return;
      // socket.send('Upload complete');
    });

    return {
      openUppyModal,
      uppy,
      socket,
    };
  },
};
</script>

<style scoped>
#uppy-select-files {
  color: white;
  background-color: green;
  padding: 0.25rem 1rem;
  border: none;
  border-radius: 5px;
}
#uppy-select-files:hover {
  cursor: pointer;
}

.is-waiting {
}
</style>
