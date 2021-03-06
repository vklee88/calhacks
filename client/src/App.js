import React, { Component } from 'react';
import io from 'socket.io-client';
import './App.css';

class App extends Component {
  BROWSER_ERR = "You seem to using a browser that does not support video. " +
                "Please don't use IE or upgrade your browser.";
  PERMISSION_ERR = "You need to allow access to a camera to run this app.";
  RATE = 33;
  URL = 'http://localhost:5000';

  constructor(props) {
    super(props);
    this.videoRef = React.createRef();

    const canvas = document.createElement('canvas'); // create a canvas
    const ctx = canvas.getContext('2d'); // get its context
    canvas.width = 300; // set its size to the one of the video
    canvas.height = 300;

    this.state = {
      err: null,
      // mediaRecorder: null,
      socket: null,
      storedStream: null,
      snapshotter: null,
      run: false,
      imageData: null,
      fileReader: new FileReader(),
      canvas: canvas,
      ctx: ctx
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
            this.setState({err: null, storedStream: stream, run: true});
            this.takeSnapshot(null, video);
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
      socket.on('prediction', imgData => {
        this.setState({imageData: imgData});
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
      clearTimeout(this.state.snapshotter);
      this.setState({snapshotter: null, run: false});
    }
    // if (this.state.mediaRecorder) {
    //   this.state.mediaRecorder.stop();
    //   this.setState({mediaRecorder: null});
    // }
  }

  takeSnapshot(c, video) {
    if (!this.state.run) {
      return;
    }
    let snapshotter = setTimeout((c) => {
      c = c || 0;
      this.setState({snapshotter: snapshotter});
      this.takeASnap(video)
        .then((blob) => {
          return this.uploadData(blob);
        }).then(() => {
          c++;
          this.takeSnapshot(c, video);
        });
    }, 20, c);
  }

  // https://stackoverflow.com/questions/46882550/how-to-save-a-jpg-image-video-captured-with-webcam-in-the-local-hard-drive-with
  takeASnap(vid){
    const canvas = this.state.canvas;
    this.state.ctx.drawImage(vid, 0,0, canvas.width, canvas.height); // the video
    return new Promise((res)=>{
      canvas.toBlob((blob) => {
        let fileReader = this.state.fileReader;
        fileReader.readAsDataURL(blob);
        fileReader.onloadend = function() {
          let base64data = fileReader.result;
          res(base64data);
        }
      }, 'image/jpeg'); // request a Blob from the canvas
    });
  }

  uploadData(blob) {
    // console.log(blobEvent);
    // console.log(this.state.socket);
    if (this.state.socket) {
      return new Promise((res) => {
        this.state.socket.emit('data', blob, (ack) => {
          res(ack);
        });
      });
    }
  }

  render() {
    return (
      <div className='App'>
        <div>
          <button className='button' onClick={() => this.startRecording()}>Start Video</button>
          <button className='button' onClick={() => this.stopRecording()}>End Video</button>
        </div>
        {this.state.err && <p>{this.state.err} Refresh the browser and try again.</p>}
        <br/>
        <div className='centered'>
          <video className='vid' height='300' width='300' ref={this.videoRef} autoPlay></video>
          <img className='vid' height='300' width='300' src={this.state.imageData} alt='no data yet'/>
        </div>
      </div>
    );
  }
}

export default App;
