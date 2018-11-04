import os
from flask import Flask, request, send_from_directory, send_file
from flask_socketio import SocketIO

app = Flask(__name__, static_folder='build')
socketio = SocketIO(app)


@app.route('/', methods=['GET'])
def index():
    return send_from_directory('build', 'index.html')


@app.route('/static/<path:path>')
def send_static_file(path):
    return send_from_directory('build/static', path)


@app.route('/manifest.json')
def send_manifest():
    return send_file('build/manifest.json')


@socketio.on('connect')
def on_create():
    print('Client connected')


@socketio.on('data')
def on_data(data):
    # image is in base64 and starts with "data:image/jpeg;base64,<image_data>"
    socket_id = request.sid
    # run ML code
    markedImage = # MLCODE call
    socketio.emit('prediction', data=markedImage, room=socket_id)


@socketio.on('disconnect')
def on_leave():
    print('Client disconnected')


if __name__ == '__main__':
    app.run(debug=True)
