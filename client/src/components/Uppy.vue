<template>
  <button id="uppy-select-files" @click="openUppyModal">
    Upload Files (Uppy)
  </button>
  <div id="drop-area" />
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
  props: {
    owner: {
      type: Object,
      default: null,
    },
  },
  emits: ['update-images'],
  setup(props, context) {
    const uppy = new Uppy({
      meta: {
        ownerId: props.owner.ownerId,
        guestId: props.owner.guestId,
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
      endpoint: `${process.env.VUE_APP_SERVER}/files/upload`,
      method: 'post',
      fieldName: 'file',
      bundle: false,
      timeout: 0,
      limit: 6,
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
    });

    uppy.on('upload', async () => {
      const files = await uppy.getFiles();
      axios.post(`${process.env.VUE_APP_SERVER}/files/initialize-upload`, {
        initializeUpload: true,
        ownerId: props.owner.ownerId,
        guestId: props.owner.guestId,
        fileCount: files.length,
        sampleImg: files[0].data.name,
      });
    });

    rws.onerror = (error) => {
      console.log('WebSocket error:', error);
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

      const msgParser = async (msg) =>
        msg.data instanceof Blob ? JSON.parse(await msg.data.text()) : msg.data;

      const data = await msgParser(msg);

      const getUppyFileId = (data, files) => {
        console.log('data:', data);
        console.log('files:', files);
        const filename = decodeURI(data.fileInfo.filename.split('/').pop());
        console.log('filename:', filename);
        return files.filter((item) => {
          if (item[filename]) return true;
        })[0][filename];
      };

      // console.log('parsed msg: ', data);

      function getMsg(type, data) {
        const msgTypes = {
          fileUploaded: async () => {
            context.emit('update-images', data.fileInfo);
          },

          statusUpdate: async () => {
            data.uppyFileId = getUppyFileId(data, files);
            return await uppy.setFileState(data.uppyFileId, {
              meta: { name: data.msg },
            });
          },
          fileFinished: async () => {
            data.uppyFileId = getUppyFileId(data, files);
            await uppy.setFileState(data.uppyFileId, {
              meta: { name: 'Complete' },
              complete: true,
            });

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
          default: () => console.log(`%c${data}`, 'color: #E46AFF'),
        };
        return (msgTypes[type] || msgTypes.default)();
      }

      getMsg(data.type, data);
    };

    uppy.on('complete', (result) => {
      console.log('upload result:', {
        sucessful: result.successful,
        failed: result.failed,
      });
    });

    uppy.on('upload-error', (file, error, response) => {
      console.log('error with file:', file);
      console.log('error message:', error);
      console.log('error response:', response);
      if (error.isNetworkError) {
        uppy.retryUpload(file.id);
      }
    });

    uppy.on('upload-retry', (fileID) => {
      console.log('upload retried:', fileID);
    });

    return {
      openUppyModal,
      uppy,
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
</style>
