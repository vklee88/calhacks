import React, { Component } from 'react';
import io from 'socket.io-client';
import './App.css';

class App extends Component {
  BROWSER_ERR = "You seem to using a browser that does not support video. " +
                "Please don't use IE or upgrade your browser.";
  PERMISSION_ERR = "You need to allow access to a camera to run this app.";
  RATE = 1000;
  URL = 'http://localhost:5000';

  constructor(props) {
    super(props);
    this.videoRef = React.createRef();
    this.state = {
      err: null,
      // mediaRecorder: null,
      socket: null,
      storedStream: null,
      snapshotter: null
    };

    this.uploadData = this.uploadData.bind(this);
  }

  startRecording() {
    if (this.state.storedStream) {
      return;
    }
    let video = this.videoRef.current;
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      let socket = io(this.URL);
      this.setState({socket: socket});
      socket.on('connect', () => {
        navigator.mediaDevices.getUserMedia({video: true})
          .then(stream => {
            video.src = window.URL.createObjectURL(stream);
            // TODO MediaRecorder is a firefox/chrome only feature
            // let mediaRecorder = new MediaRecorder(stream, {
            //   mimeType : 'video/webm'
            // });
            // mediaRecorder.start(this.RATE);
            // mediaRecorder.ondataavailable = this.uploadData;
            // this.setState({err: null, storedStream: stream, mediaRecorder: mediaRecorder});
            let finished = true; // hack to make sure that we're not overloading system; assumption is that RATE is not too small
            let snapshotter = setInterval(() => {
              if (!finished) {
                return;
              }
              finished = false;
              this.takeASnap(video)
                .then((blob) => {
                  return this.uploadData(blob);
                }).then(ack => {
                  console.log(ack);
                  finished = true;
                }).catch(err => {
                  console.log('Failed response from server');
                  finished = true;
                });
            }, this.RATE);

            this.setState({err: null, storedStream: stream, snapshotter: snapshotter});
          })
          .catch(err => {
            let message = err.message;
            if (err.name === "PermissionDeniedError") {
              message = this.PERMISSION_ERR;
            }
            this.setState({err: message});
          });
      });
      socket.on('connect_timeout', () => {
        alert('Timeout when connecting to server');
        this.state.socket.close();
        this.setState({socket: null});
      });
    } else {
        this.setState({err: this.BROWSER_ERR});
    }
  }

  stopRecording() {
    if (this.state.socket) {
      this.state.socket.close();
      this.setState({socket: null});
    }
    if (this.state.storedStream) {
      for (let track of this.state.storedStream.getTracks()) {
        track.stop();
      }
      this.setState({storedStream: null});
    }
    if (this.state.snapshotter) {
      clearInterval(this.state.snapshotter);
      this.setState({snapshotter: null});
    }
    // if (this.state.mediaRecorder) {
    //   this.state.mediaRecorder.stop();
    //   this.setState({mediaRecorder: null});
    // }
  }

  // https://stackoverflow.com/questions/46882550/how-to-save-a-jpg-image-video-captured-with-webcam-in-the-local-hard-drive-with
  takeASnap(vid){
    const canvas = document.createElement('canvas'); // create a canvas
    const ctx = canvas.getContext('2d'); // get its context
    canvas.width = vid.videoWidth; // set its size to the one of the video
    canvas.height = vid.videoHeight;
    ctx.drawImage(vid, 0,0); // the video
    return new Promise((res, rej)=>{
      canvas.toBlob(res, 'image/jpeg'); // request a Blob from the canvas
    });
  }

  uploadData(blob) {
    // console.log(blobEvent);
    // console.log(this.state.socket);
    if (this.state.socket) {
      return new Promise((res, rej) => {
        this.state.socket.emit('data', blob, (ack) => {
          if (ack) {
            res(ack);
          } else {
            rej('Not acknowledged')
          }
        });
      });
    }
  }

  render() {
    return (
      <div>
        <div>
          <button onClick={() => this.startRecording()}>Start Video</button>
          <button onClick={() => this.stopRecording()}>End Video</button>
        </div>
        {this.state.err && <p>{this.state.err} Refresh the browser and try again.</p>}
        <video height='300' width='300' ref={this.videoRef} autoPlay></video>
      </div>
    );
  }
}

export default App;
