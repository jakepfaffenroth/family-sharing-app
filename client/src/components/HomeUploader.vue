<template>
  <div />
</template>

<script>
import { computed, inject, onMounted, onUpdated } from 'vue';
import { useStore } from 'vuex';
import Uppy from '@uppy/core';
import Dashboard from '@uppy/dashboard';
import EmptyDashboard from '@uppy/dashboard';
import XHRUpload from '@uppy/xhr-upload';
import ReconnectingWebSocket from 'reconnecting-websocket';
import http from '../utils/http';

import '@uppy/core/dist/style.css';
import '@uppy/dashboard/dist/style.css';

export default {
  name: 'Uploader',
  props: {
    activeGallery: { type: String, default: 'All' }
  },
  setup(props, context) {
    const store = useStore();
    const toast = inject('toast');
    const owner = computed(() => store.state.ownerStore.owner);
    const ownerId = computed(() => store.getters.ownerId);
    const guestId = computed(() => store.getters.guestId);

    const uppy = new Uppy({
      meta: {
        ownerId: ownerId.value,
        guestId: guestId.value
      },
      // logger: Uppy.debugLogger,
      autoProceed: false,
      restrictions: {
        allowedFileTypes: ['image/*'],
        // file size limit is 100mb for premium users, 10mb for basic users
        maxFileSize: owner.value.premiumUser ? 1048576 * 100 : 1048576 * 10
      },
      onBeforeUpload: () => {
        uppy.setOptions({
          meta: {
            ownerId: ownerId.value,
            guestId: guestId.value
          }
        });
        uppy.getPlugin('Dashboard:StatusBar').setOptions({
          hideAfterFinish: true,
          locale: {
            strings: {
              complete: 'Upload complete (You can leave this page)'
            }
          }
        });
        uppy.getPlugin('XHRUpload').setOptions({
          headers: {
            id: ownerId.value
          }
        });
      }
    });

    onMounted(() => {
      const basicRestrictions = 'Images only, up to 10 MB each';
      const premiumRestrictions = 'Images only, up to 100 MB each';

      try {
        uppy.use(Dashboard, {
          target: '#uploader',
          trigger: '.uppy-select-files', // Upload Button and HomeEmptyGallery.vue
          closeModalOnClickOutside: true,
          theme: 'auto',
          inline: false,
          showProgressDetails: true,
          disableInformer: true,
          note: owner.value.premiumUser
            ? premiumRestrictions
            : basicRestrictions,
          proudlyDisplayPoweredByUppy: false,
          locale: {
            strings: {
              complete: 'Upload complete (You can leave this page)'
            }
          }
        });
      } catch (err) {
        console.error(err);
      }
      //  TODO - Replace empty gallery with this uppy uploader
      // uppy.use(EmptyDashboard, {
      //   id: EmptyDashboard,
      //   target: '#empty-gallery',
      //   trigger: '.uppy-select-files', // Defined in App.vue
      //   closeModalOnClickOutside: true,
      //   theme: 'light',
      //   inline: true,
      //   width: 1000,
      //   height: 550,
      //   showProgressDetails: true,
      //   proudlyDisplayPoweredByUppy: false,
      //   locale: {
      //     strings: {
      //       complete: 'Upload complete (You can leave this page)'
      //     }
      //   }
      // });
    });

    uppy.use(XHRUpload, {
      endpoint: `${process.env.VUE_APP_SERVER}/files/upload`,
      method: 'post',
      fieldName: 'file',
      headers: {
        id: ownerId.value
      },
      bundle: false,
      timeout: 0,
      limit: 6
    });

    uppy.on('restriction-failed', (file, error) => {
      const restrictToast = toast.open({
        type: 'error',
        duration: 6000,
        message: `<div id="toast-message"><p id="msg-text">${error.message.replace(
          'This file',
          file.data.name
        )}</p></div>`
      });
    });

    uppy.on('file-added', async file => {
      uppy.setFileMeta(file.id, { uppyFileId: file.id });
    });

    uppy.on('upload', async () => {
      const files = await uppy.getFiles();
      http.post('/files/initialize-upload', {
        initializeUpload: true,
        ownerId: ownerId.value,
        guestId: guestId.value,
        sessionUploadCount: files.length,
        sampleImg: files[0].data.name
      });
    });

    const rws = new ReconnectingWebSocket(process.env.VUE_APP_WSS);

    rws.onclose = () => {
      console.log('WebSocket is closed.');
    };

    rws.onerror = error => {
      console.log('WebSocket error:', error);
    };

    rws.onopen = () => {
      rws.send('ping');
    };

    rws.onmessage = async msg => {
      // if (msg.data === 'uploadsComplete') {
      //   store.dispatch('getUsageData', { ownerId: ownerId.value });
      //   return;
      // }

      // ----- TURN OFF STATUS UPDATES ----- //
      // return
      // ----------------------------------- //
      const files = uppy.getFiles().map(item => {
        const newObj = {};
        newObj[item.name] = item.id;
        return newObj;
      });

      const data =
        msg.data instanceof Blob ? JSON.parse(await msg.data.text()) : msg.data;

      getMsg(data);

      function getUppyFileId(data, files) {
        const filename = unescape(data.fileInfo.filename.split('/').pop());
        return files.filter(item => {
          if (item[filename]) return true;
        })[0][filename];
      }

      function getMsg(data) {
        const msgTypes = {
          fileUploaded: async () => {
            store.dispatch('addToImages', data.fileInfo);
          },
          statusUpdate: async () => {
            data.uppyFileId = getUppyFileId(data, files);
            return await uppy.setFileState(data.uppyFileId, {
              meta: { name: data.msg }
            });
          },
          fileFinished: async () => {
            data.uppyFileId = getUppyFileId(data, files);
            await uppy.setFileState(data.uppyFileId, {
              meta: { name: 'Complete' },
              complete: true
            });

            const state = await uppy.getState();

            if (Object.values(state.files).every(item => item.complete)) {
              await uppy.getPlugin('Dashboard:StatusBar').setOptions({
                locale: {
                  strings: {
                    complete: 'Complete'
                  }
                }
              });
            }
            return rws.send('Complete Confirmed');
          },
          default: () => console.log(`%c${data}`, 'color: #E46AFF')
        };
        return (msgTypes[data.type] || msgTypes.default)();
      }
    };

    uppy.on('complete', result => {
      const upToast = toast.open({
        type: 'success',
        duration: 3000,
        message: `<div id="toast-message"><p id="msg-text">Upload complete.<br>${
          result.successful.length
        } files uploaded.${
          result.failed.length ? ' ' + result.failed.length + ' failed.' : ''
        }</p></div>`
      });
      console.log('upload result:', {
        successful: result.successful,
        failed: result.failed
      });
    });

    uppy.on('upload-error', (file, error, response) => {
      toast.error('Error uploading file');
      console.error('error with file:', file);
      console.error('error message:', error);
      console.error('error response:', response);
      if (error.isNetworkError) {
        uppy.retryUpload(file.id);
      }
    });

    uppy.on('upload-retry', fileID => {
      console.log('upload retried:', fileID);
    });

    return {
      uppy
    };
  }
};

export const uppy = uppy;
</script>
