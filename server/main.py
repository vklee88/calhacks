from flask import Flask, request, send_from_directory, send_file
from flask_socketio import SocketIO
from recognition import b64_to_img, img_to_b64, draw_box_and_panic

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
    # start ML code
    img = b64_to_img(data.split(',', maxsplit=1)[1])
    img_with_box, panic_or_not = draw_box_and_panic(img)  # TODO: do something with `panic_or_not`
    markedImage = str(b'data:image/jpeg;base64,' + img_to_b64(img_with_box)[2: -1]
    # end ML code
    socketio.emit('prediction', data=str(markedImage), room=socket_id)


@socketio.on('disconnect')
def on_leave():
    print('Client disconnected')


if __name__ == '__main__':
    app.run(debug=False)
