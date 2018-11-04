import io
import os

# Imports the Google Cloud client library
from google.cloud import vision
from google.cloud.vision import types

# Instantiates a client
client = vision.ImageAnnotatorClient()


for i in range(1,11):
	name = "samples/{0}.jpg".format(i)
	# The name of the image file to annotate
	file_name = os.path.join(
		os.path.dirname(__file__),	name)

	# Loads the image into memory
	with io.open(file_name, 'rb') as image_file:
		content = image_file.read()

	image = types.Image(content=content)

	# Performs label detection on the image file
	response = client.label_detection(image=image)
	labels = response.label_annotations

	leg = False

	for label in labels:
		if (label.description == "leg" and label.score > 0.5):
			leg = True



	if (leg):
		print("In picture{0}, baby is climbing the crib".format(i))
	else: 
		print("In picture{0}, baby is safe".format(i))




