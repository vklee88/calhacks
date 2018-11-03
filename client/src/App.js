import React, { Component } from 'react';
import io from 'socket.io-client';
import './App.css';

class App extends Component {
  BROWSER_ERR = "You seem to using a browser that does not support video. " +
                "Please don't use IE or upgrade your browser.";
  PERMISSION_ERR = "You need to allow access to a camera to run this app.";
  URL = 'http://localhost:5000';

  constructor(props) {
    super(props);
    this.videoRef = React.createRef();
    this.state = {
      err: null,
      mediaRecorder: null,
      socket: null,
      storedStream: null
    };

    this.uploadData = this.uploadData.bind(this);
  }

  startRecording() {
    let video = this.videoRef.current;
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      let socket = io(this.URL);
      this.setState({socket: socket});
      socket.on('connect', () => {
        navigator.mediaDevices.getUserMedia({video: true})
          .then(stream => {
            video.src = window.URL.createObjectURL(stream);
            // TODO MediaRecorder is a firefox/chrome only feature
            let mediaRecorder = new MediaRecorder(stream, {
              mimeType : 'video/webm'
            });
            mediaRecorder.start(1000);
            mediaRecorder.ondataavailable = this.uploadData;
            this.setState({err: null, storedStream: stream, mediaRecorder: mediaRecorder});
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
    if (this.state.mediaRecorder) {
      this.state.mediaRecorder.stop();
      this.setState({mediaRecorder: null});
    }
  }

  uploadData(blobEvent) {
    console.log(blobEvent);
    console.log(this.state.socket);
    if (this.state.socket) {
      this.state.socket.emit('data', blobEvent.data);
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
        <video ref={this.videoRef} autoPlay></video>
      </div>
    );
  }
}

export default App;
