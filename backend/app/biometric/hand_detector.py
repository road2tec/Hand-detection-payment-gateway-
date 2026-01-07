import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import cv2
import numpy as np
import os

class HandDetector:
    def __init__(self, mode=False, max_hands=1, detection_con=0.5, track_con=0.5):
        # Path to the model file
        model_path = os.path.join(os.path.dirname(__file__), 'hand_landmarker.task')
        
        base_options = python.BaseOptions(model_asset_path=model_path)
        options = vision.HandLandmarkerOptions(
            base_options=base_options,
            num_hands=max_hands,
            min_hand_detection_confidence=0.3,
            min_hand_presence_confidence=0.3,
            min_tracking_confidence=track_con
        )
        self.detector = vision.HandLandmarker.create_from_options(options)

    def find_hands(self, img, draw=True):
        # Convert the image to MediaPipe Image object
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=img_rgb)
        
        # Detect hands
        detection_result = self.detector.detect(mp_image)
        
        all_hands = []
        if detection_result.hand_landmarks:
            for i, hand_landmarks in enumerate(detection_result.hand_landmarks):
                lm_list = []
                for landmark in hand_landmarks:
                    # Normalized coordinates
                    lm_list.append([landmark.x, landmark.y, landmark.z])
                
                # Get hand label (Left/Right)
                hand_label = detection_result.handedness[i][0].category_name
                
                all_hands.append({
                    "lmList": lm_list,
                    "type": hand_label
                })
                
                if draw:
                    self._draw_landmarks(img, hand_landmarks)
        
        return all_hands, img

    def _draw_landmarks(self, img, hand_landmarks):
        h, w, _ = img.shape
        for landmark in hand_landmarks:
            cx, cy = int(landmark.x * w), int(landmark.y * h)
            cv2.circle(img, (cx, cy), 5, (255, 0, 255), cv2.FILLED)

    def find_position(self, img, hand_no=0):
        # This method is used by feature_extractor.py
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=img_rgb)
        detection_result = self.detector.detect(mp_image)
        
        lm_list = []
        hand_label = None
        if detection_result.hand_landmarks and len(detection_result.hand_landmarks) > hand_no:
            for landmark in detection_result.hand_landmarks[hand_no]:
                lm_list.append([landmark.x, landmark.y, landmark.z])
            hand_label = detection_result.handedness[hand_no][0].category_name
            
        return lm_list, hand_label
