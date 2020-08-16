const { Plugin } = require('@uppy/core');

module.exports = class WebsocketUpload extends Plugin {
  constructor(uppy, opts) {
    super(uppy, opts);
    this.id = opts.id || 'WebsocketUpload';
    this.type = 'uploader';
    this.title = 'WebsocketUpload';
    this.endpoint = opts.endpoint;

    this.opts = Object.assign({}, opts);
  }

  // async connect() {
  //   const connection = async () => {
  //     const socket = new WebSocket(this.endpoint);
  //     socket.onopen = () => {
  //       socket.send('hey');
  //     };

  //     socket.onerror = (error) => {
  //       console.log(`WebSocket error:`, error);
  //     };

  //     socket.onmessage = (e) => {
  //       console.log(e.data);
  //     };
  //   };
  //   this.connection = connection;
  //   console.log('this.connection: ', this.connection);
  //   return this.connection;
  // }

  async upload(fileIDs) {
    console.log('test');
    if (fileIDs.length === 0) {
      this.uppy.log('[WebsocketUpload] No files to upload!');
      return Promise.resolve();
    }

    // this.uppy.on('upload', () => {
    console.log('1');

    const ws = async () => {
      console.log('testing');
      return new WebSocket(this.endpoint);
    };
    console.log('G');
    const socket = await ws();
    console.log('socket.readyState: ', socket.readyState);
    console.log('2');
    socket.onopen = () => {
      console.log('socket.readyState: ', socket.readyState);
      socket.send('hey there!');
      console.log('socket.readyState: ', socket.readyState);
      console.log('open now');

      console.log('fileIDs: ', fileIDs);
      const promises = fileIDs.map((fileID) => {
        console.log('3');
        console.log('socket.readyState: ', socket.readyState);
        const file = this.uppy.getFile(fileID);
        // this.uppy.emit('preprocess-progress', file, {
        //   mode: 'indeterminate',
        //   message: this.i18n('compressingImages'),
        // });

        if (file.type.split('/')[0] !== 'image') {
          return;
        }
        socket.send(file.data);
      });
      // while (socket) {
      //   console.log('socket.readyState: ', socket.readyState);
      //   if (socket.readyState != 0) break;
      // }
      console.log('socket.readyState: ', socket.readyState);
      return Promise.all(promises);
    };

    socket.onerror = (error) => {
      console.log(`WebSocket error:`, error);
    };

    socket.onclose = (close) => {
      console.log('Websocket closed: ', close);
    };

    socket.onmessage = (e) => {
      console.log(e.data);
    };

    // });
  }

  install() {
    // this.uppy.addUploader(this.connect);
    console.log('Install');
    this.uppy.addPreProcessor(this.upload.bind(this));
  }

  uninstall() {
    // this.uppy.removeUploader(this.connect);
    this.uppy.removePreProcessor(this.upload);
  }
};
