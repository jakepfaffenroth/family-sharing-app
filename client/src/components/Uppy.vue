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
import ReconnectingWebSocket from 'reconnecting-websocket';
import axios from 'axios';

import '@uppy/core/dist/style.css';
import '@uppy/dashboard/dist/style.css';

export default {
  props: { user: Object },
  setup(props, context) {
    const uppy = new Uppy({
      meta: {
        userId: props.user.userId,
        guestId: props.user.guestId,
      },
      // logger: Uppy.debugLogger,
      autoProceed: false,
      onBeforeUpload: () => {
        uppy.getPlugin('Dashboard:StatusBar').setOptions({
          hideAfterFinish: true,
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
    });
    uppy.use(xhr, {
      endpoint: process.env.VUE_APP_SERVER + '/files/upload',
      method: 'post',
      responseType: document,
      bundle: false,
      timeout: 0,
      limit: 3,
    });

    const openUppyModal = () => {
      uppy.getPlugin('Dashboard').openModal();
    };

    const rws = new ReconnectingWebSocket(process.env.VUE_APP_WSS);

    rws.onclose = () => {
      console.log('WebSocket is closed.');
    };

    uppy.on('file-added', async (file) => {
      uppy.setFileMeta(file.id, { uppyFileId: file.id });
      console.log('Master')
    });

    uppy.on('upload', async () => {
      const files = await uppy.getFiles();
      axios.post(process.env.VUE_APP_SERVER + '/files/upload', {
        initializeUpload: true,
        userId: props.user.userId,
        guestId: props.user.guestId,
        fileCount: files.length,
        sampleImg: files[0].data.name,
      });
    });

    rws.onerror = (error) => {
      console.log(`WebSocket error:`, error);
    };

    rws.onopen = () => {
      rws.send('ping');
    };

    rws.onmessage = async (msg) => {
      // ----- TURN OFF STATUS UPDATES ----- //
      // return
      // ----------------------------------- //
      const files = uppy.getFiles().map((item) => {
        const newObj = {};
        newObj[item.name] = item.id;
        return newObj;
      });

      const msgParser = async (msg) => {
        return msg.data instanceof Blob ? JSON.parse(await msg.data.text()) : msg.data;
      };

      let data = await msgParser(msg);

      const getUppyFileId = (data, files) => {
        const filename = decodeURI(data.filename.split('/').pop());
        return files.filter((item) => {
          if (item[filename]) return true;
        })[0][filename];
      };

      // console.log('parsed msg: ', data);

      function getMsg(type, data) {
        const msgTypes = {
          fileUploaded: async () => {
            context.emit('update-images', data.fileInfo);

            data.uppyFileId = getUppyFileId(data, files);
            const progress = uppy.getState().files[data.uppyFileId].progress;
            return await uppy.setFileState(data.uppyFileId, {
              meta: { name: data.msg },
              progress: {
                ...progress,
                uploadComplete: true,
                percentage: 100,
              },
            });
          },

          statusUpdate: async () => {
            data.uppyFileId = getUppyFileId(data, files);
            return await uppy.setFileState(data.uppyFileId, { meta: { name: data.msg } });
          },
          fileFinished: async () => {
            data.uppyFileId = getUppyFileId(data, files);
            await uppy.setFileState(data.uppyFileId, { meta: { name: 'Complete' }, complete: true });

            const state = await uppy.getState();

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
            return rws.send('Complete Confirmed');
          },
          default: () => {
            return console.log('%c' + data, 'color: #E46AFF');
          },
        };
        return (msgTypes[type] || msgTypes['default'])();
      }

      getMsg(data.type, data);
    };

    uppy.on('complete', (result) => {
      console.log('upload result:', { sucessful: result.successful, failed: result.failed });
    });

    // uppy.on('upload-success', (file, response) => {});

    return {
      openUppyModal,
      uppy,
      rws,
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
