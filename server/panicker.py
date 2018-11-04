import tensorflow as tf

PANIC_THRESHOLD = 42_000

def panic(centermost):
    return distance_from_center(centermost) > PANIC_THRESHOLD

def centermost_box(boxes):
    return min(list(boxes), key=lambda box: distance_from_center(box))

def distance_from_center(box, w=300, h=300):
    """Finds the distance of the center of a bounding box
    from the center of the image.
    
    Parameters
    ----------
    box: an iterable with contents [xmin, ymin, xmax, ymax]
    h:   height of the image
    w: width of the image
    """
    x_bar, y_bar = center(box)
    return (w/2 - x_bar)**2 + (h/2 - y_bar)**2

def center(box):
    """Finds the center of a bounding box.
    
    Parameters
    ----------
    box: an iterable with contents [xmin, ymin, xmax, ymax]
    """
    ymin, xmin, ymax, xmax = list(box)

    return (xmax + xmin) / 2, (ymax + ymin) / 2
