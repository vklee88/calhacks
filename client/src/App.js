import React, { Component } from 'react';
import MediaStreamRecorder from 'msr';
import io from 'socket.io-client';
import './App.css';

class App extends Component {
  BROWSER_ERR = "You seem to using a browser that does not support video. " +
                "Please don't use IE or upgrade your browser.";
  PERMISSION_ERR = "You need to allow access to a camera to run this app.";

  constructor(props) {
    super(props);
    this.videoRef = React.createRef();
    this.state = {
      err: null
    };
    this.mediaRecorder = null;
    this.socket = null;
    this.storedStream = null;
  }

  startRecording() {
    let video = this.videoRef.current;
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({video: true})
        .then(stream => {
          this.socket = io('ws://localhost');
          socket.on('connect', () => {
            this.setState({err: null});
            video.src = window.URL.createObjectURL(stream);
            this.storedStream = stream;
            this.mediaRecorder = new MediaStreamRecorder(stream);
            this.mediaRecorder.mimeType = 'video/webm';
            this.mediaRecorder.ondataavailable(this.uploadData);
          });
        })
        .catch(err => {
          let message = err.message;
          if (err.name === "PermissionDeniedError") {
            message = this.PERMISSION_ERR;
          }
          this.setState({err: message});
        });
    } else {
      this.setState({err: this.BROWSER_ERR});
    }
  }

  stopRecording() {
    if (this.storedStream) {
      if (this.socket) {
        this.socket.close();
        this.socket = null;
      }
      for (let track of this.storedStream.getTracks()) {
        track.stop();
      }
      this.storedStream = null;
    }
  }

  uploadData(blob) {
    this.socket.emit('data', blob);
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
