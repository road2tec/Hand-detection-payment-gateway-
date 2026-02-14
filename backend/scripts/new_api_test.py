import sklearn.metrics._pairwise_distances_reduction
import asyncio.proactor_events
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import cv2
import numpy as np
import os
import sys
from pathlib import Path

# Add project root to path
root_dir = Path(__file__).resolve().parent.p   arent.parent
sys.path.append(str(root_dir))

# This is the new way to use mediapipe
# Needs a model file (.task) or can download one

class HandDetectorTasks:
    def __init__(self, model_path=None):
        pass

# Scripts for debugging mediapipe issues
print("Mediapipe Task Test Script Loaded")
