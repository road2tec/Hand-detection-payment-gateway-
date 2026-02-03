import numpy as np
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image

class FeatureExtractor:
    def __init__(self):
        # Initialize MobileNetV2 for lightweight feature extraction
        self.model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.DEFAULT)
        # Remove the last classification layer to get features
        self.model.classifier = nn.Identity()
        self.model.eval()
        
        self.preprocess = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])

    @staticmethod
    def calculate_distance(p1, p2):
        return np.sqrt((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2)

    @staticmethod
    def calculate_angle(p1, p2, p3):
        """Calculate angle at p2 between vectors p2-p1 and p2-p3."""
        v1 = np.array(p1) - np.array(p2)
        v2 = np.array(p3) - np.array(p2)
        norm1 = np.linalg.norm(v1)
        norm2 = np.linalg.norm(v2)
        if norm1 == 0 or norm2 == 0: return 0.0
        unit_v1, unit_v2 = v1 / norm1, v2 / norm2
        return float(np.arccos(np.clip(np.dot(unit_v1, unit_v2), -1.0, 1.0)))

    def extract_cnn_features(self, image_np):
        """
        Extract deep features using MobileNetV2.
        Input: Numpy image (BGR or RGB)
        Output: 1280-D feature vector
        """
        try:
            # Convert numpy image to PIL
            if len(image_np.shape) == 3:
                image_pil = Image.fromarray(image_np)
            else:
                return None
                
            input_tensor = self.preprocess(image_pil)
            input_batch = input_tensor.unsqueeze(0)  # Create a mini-batch as expected by the model

            with torch.no_grad():
                features = self.model(input_batch)
            
            return features.numpy().flatten().tolist()
        except Exception as e:
            print(f"CNN Extraction Error: {e}")
            return None

    @staticmethod
    def extract_features(landmarks):
        """
        Extract 51-Dimensional high-fidelity geometric signature.
        Rotation and Scale Invariant.
        """
        if not landmarks or len(landmarks) < 21: return None
        
        pts = np.array(landmarks)[:, :2] # Use only x, y for geometry
        features = []
        
        # 1. Base Reference: Wrist to Middle Finger Base
        ref_dist = FeatureExtractor.calculate_distance(pts[0], pts[9])
        if ref_dist == 0: return None

        # 2. Point-to-Wrist Ratios (20 features)
        for i in range(1, 21):
            features.append(FeatureExtractor.calculate_distance(pts[0], pts[i]) / ref_dist)

        # 3. Inter-finger Angles (4 features)
        # Thumb(4)-Wrist(0)-Index(8), etc.
        finger_tips = [4, 8, 12, 16, 20]
        for i in range(len(finger_tips) - 1):
            features.append(FeatureExtractor.calculate_angle(pts[finger_tips[i]], pts[0], pts[finger_tips[i+1]]))

        # 4. Finger Segment Ratios (Internal 5 segments x 4 fingers = 20 features)
        # For each finger: Tip->DIP / DIP->PIP, PIP->MCP / ref_dist, etc.
        # Index: 5(Base), 6(PIP), 7(DIP), 8(Tip)
        fingers = [[5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16], [17, 18, 19, 20]]
        for f in fingers:
            d1 = FeatureExtractor.calculate_distance(pts[f[3]], pts[f[2]])
            d2 = FeatureExtractor.calculate_distance(pts[f[2]], pts[f[1]])
            d3 = FeatureExtractor.calculate_distance(pts[f[1]], pts[f[0]])
            features.append(d1/ref_dist)
            features.append(d2/ref_dist)
            features.append(d3/ref_dist)
            features.append(d1/(d2 + 1e-6))
            features.append(d2/(d3 + 1e-6))

        # 5. Hand Aspect Ratio (4 features)
        palm_width = FeatureExtractor.calculate_distance(pts[5], pts[17])
        features.append(palm_width / ref_dist)
        
        # 6. Triangle Areas (Curvature)
        # (Wrist, IndexBase, MiddleBase), etc.
        for i in [5, 9, 13]:
            area = 0.5 * np.abs(np.cross(pts[i]-pts[0], pts[i+4]-pts[0]))
            features.append(area / (ref_dist**2))

        return np.array(features).tolist()
