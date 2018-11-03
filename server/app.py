from flask import Flask
from flask_socketio import SocketIO

app = Flask(__name__)
socketio = SocketIO(app)


@app.route('/', methods=['GET'])
def index():
    app.send_static_file('index.js')


@socketio.on('create')
def on_create(data):
    print(data)


@socketio.on('join')
def on_join(data):
    print(data)


@socketio.on('data')
def on_data(data):
    # run ML code
    print(data)


@socketio.on('leave')
def on_leave(data):
    print(data)

if __name__ == '__main__':
    app.run(debug=True)