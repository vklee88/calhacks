from flask import Flask, request
from flask_socketio import SocketIO

app = Flask(__name__)
socketio = SocketIO(app)


@app.route('/', methods=['GET'])
def index():
    app.send_static_file('index.js')


@socketio.on('connect')
def on_create():
    print('Client connected')


@socketio.on('data')
def on_data(data):
    # run ML code
    socket_id = request.namespace.socket.sessid
    print('Socket ID:', socket_id)
    print('Data:', data)


@socketio.on('disconnect')
def on_leave():
    print('Client disconnected')


if __name__ == '__main__':
    app.run()
