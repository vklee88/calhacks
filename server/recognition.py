import cv2
import numpy as np
from PIL import Image
import tensorflow as tf

import base64
from io import BytesIO

global_graph = tf.Graph()

def load_graph(frozen_model):
    """Loads a frozen TensorFlow graph for inference."""
    with tf.gfile.GFile(frozen_model, 'rb') as f:
        graph_def = tf.GraphDef()
        graph_def.ParseFromString(f.read())

    with global_graph.as_default() as graph:
        tf.import_graph_def(graph_def, name='baby')
    
    return graph

print(global_graph is load_graph('ssd_mobilenet/frozen_inference_graph.pb'))  # True

global_session = tf.Session(graph=global_graph)

# ops = list(global_graph.get_operations())
# # ops.reverse()
# for idx, op in enumerate(ops):
#     if idx < 10:
#         print(op.name)

input_img = global_graph.get_tensor_by_name('baby/image_tensor:0')
detection_classes = global_graph.get_tensor_by_name('baby/detection_classes:0')
detection_boxes = global_graph.get_tensor_by_name('baby/detection_boxes:0')
detection_scores = global_graph.get_tensor_by_name('baby/detection_scores:0')
num_detections = global_graph.get_tensor_by_name('baby/num_detections:0')
print('input_img:', input_img)
# print('y:', y)

def predict(img):
    img = cv2.imread(img, 1)  # convert image to numpy array
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img = cv2.resize(img, (300, 300))  # resize to 300 x 300
    img = np.expand_dims(img, axis=0)
    output = {}
    output['classes'] = global_session.run(detection_classes, feed_dict={input_img: img})
    output['boxes'] = global_session.run(detection_boxes, feed_dict={input_img: img})
    output['scores'] = global_session.run(detection_scores, feed_dict={input_img: img})
    output['num_detections'] = global_session.run(num_detections, feed_dict={input_img: img})

    return img, output

def draw_box(img):
    img_array, prediction_dict = predict(img)
    top_boxes = prediction_dict['boxes'][:, :3, :][0, :]
    top_labels = [categories(int(code)) for idx, code in enumerate(list(prediction_dict['classes'][0])) if idx < 3]
    img_array = img_array.reshape(300, 300, 3)

    for idx, (box, label) in enumerate(zip(list(top_boxes), top_labels)):
        color = [(255, 0, 0), (0, 255, 0), (0, 0, 255)][idx]
        draw_one_box(img_array, box, color, label)
    
    return img_array

def b64_to_img(b64_str):
    im = Image.open(BytesIO(base64.b64decode(b64_str)))
    i = np.asarray(im)
    return i

# this is working
def img_to_b64(img_arr):
    compressed_img_arr = cv2.imencode('.jpg', img_arr)[1]
    b64_str = base64.b64encode(compressed_img_arr)
    return b64_str
    
def draw_one_box(img, box, color, label):
    box = 300 * box
    xmin, ymin, xmax, ymax = list(box)
    cv2.rectangle(img, (xmin, ymin), (xmax, ymax), color, 3)
    print(label)
    # cv2.putText(img, label, (xmax, ymax), cv2.FONT_HERSHEY_SIMPLEX, 4, color, 2, cv2.LINE_AA)

def categories(idx):  # 80 classes
    try:
        result= ['background',  # class zero
                'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat', 'traffic light',
                'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat', 'dog', 'horse', 'sheep', 'cow',
                'elephant', 'bear', 'zebra', 'giraffe', 'backpack', 'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee',
                'skis', 'snowboard', 'sports ball', 'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 'tennis racket', 'bottle',
                'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple', 'sandwich', 'orange',
                'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair', 'couch', 'potted plant', 'bed',
                'dining table', 'toilet', 'tv', 'laptop', 'mouse', 'remote', 'keyboard', 'cell phone', 'microwave', 'oven',
                'toaster', 'sink', 'refrigerator', 'book', 'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush'][idx]
    except IndexError as e:
        print('Failed to look up index', idx)
        result = None
    
    return result
