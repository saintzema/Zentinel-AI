import numpy as np
from scipy.spatial import distance as dist
from collections import OrderedDict
import logging

logger = logging.getLogger(__name__)

class CentroidTracker:
    def __init__(self, max_disappeared=15, max_distance=100):
        """
        max_disappeared: Number of frames an object can be missing before it's deleted.
        max_distance: Maximum distance between centroids to consider them the same object.
        """
        self.next_id = 1 # Start from 1 for tactical feel
        self.objects = OrderedDict()  # ID -> (cx, cy)
        self.boxes = OrderedDict()    # ID -> (x1, y1, x2, y2)
        self.labels = OrderedDict()   # ID -> class_name
        self.disappeared = OrderedDict() # ID -> count
        
        self.max_disappeared = max_disappeared
        self.max_distance = max_distance

    def register(self, centroid, box, label):
        self.objects[self.next_id] = centroid
        self.boxes[self.next_id] = box
        self.labels[self.next_id] = label
        self.disappeared[self.next_id] = 0
        self.next_id += 1

    def deregister(self, object_id):
        del self.objects[object_id]
        del self.disappeared[object_id]
        del self.boxes[object_id]
        del self.labels[object_id]

    def update(self, rects, labels):
        """
        rects: list of (x1, y1, x2, y2)
        labels: list of strings
        """
        if len(rects) == 0:
            for object_id in list(self.disappeared.keys()):
                self.disappeared[object_id] += 1
                if self.disappeared[object_id] > self.max_disappeared:
                    self.deregister(object_id)
            return self.get_tracks()

        input_centroids = np.zeros((len(rects), 2), dtype="int")
        for (i, (startX, startY, endX, endY)) in enumerate(rects):
            cX = int((startX + endX) / 2.0)
            cY = int((startY + endY) / 2.0)
            input_centroids[i] = (cX, cY)

        if len(self.objects) == 0:
            for i in range(0, len(input_centroids)):
                self.register(input_centroids[i], rects[i], labels[i])
        else:
            object_ids = list(self.objects.keys())
            object_centroids = list(self.objects.values())

            D = dist.cdist(np.array(object_centroids), input_centroids)

            rows = D.min(axis=1).argsort()
            cols = D.argmin(axis=1)[rows]

            used_rows = set()
            used_cols = set()

            for (row, col) in zip(rows, cols):
                if row in used_rows or col in used_cols:
                    continue

                if D[row, col] > self.max_distance:
                    continue

                object_id = object_ids[row]
                self.objects[object_id] = input_centroids[col]
                self.boxes[object_id] = rects[col]
                self.labels[object_id] = labels[col]
                self.disappeared[object_id] = 0

                used_rows.add(row)
                used_cols.add(col)

            unused_rows = set(range(0, D.shape[0])).difference(used_rows)
            unused_cols = set(range(0, D.shape[1])).difference(used_cols)

            if D.shape[0] >= D.shape[1]:
                for row in unused_rows:
                    object_id = object_ids[row]
                    self.disappeared[object_id] += 1
                    if self.disappeared[object_id] > self.max_disappeared:
                        self.deregister(object_id)
            else:
                for col in unused_cols:
                    self.register(input_centroids[col], rects[col], labels[col])

        return self.get_tracks()

    def get_tracks(self):
        """Return list of track objects for API consistency"""
        tracks = []
        for object_id in self.objects:
            box = self.boxes[object_id]
            tracks.append({
                "id": object_id,
                "label": self.labels[object_id],
                "box": [float(x) for x in box],  # [x1, y1, x2, y2]
                "centroid": [int(x) for x in self.objects[object_id]],
                "disappeared": self.disappeared[object_id]
            })
        return tracks
