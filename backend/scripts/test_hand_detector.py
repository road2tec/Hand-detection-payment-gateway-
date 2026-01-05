import sys
import os
import cv2
import numpy as np
from pathlib import Path

# Add project root to path
root_dir = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(root_dir))

print("Testing HandDetector...")
try:
    from backend.app.biometric.hand_detector import HandDetector
    print("✅ Imported HandDetector")
    
    detector = HandDetector(mode=True)
    print("✅ Initialized HandDetector")
    
    # Create a dummy image
    img = np.zeros((480, 640, 3), dtype=np.uint8)
    
    all_hands, processed_img = detector.find_hands(img)
    print(f"✅ Executed find_hands (Detected: {len(all_hands)})")
    
    print("HandDetector test PASSED")
except Exception as e:
    print(f"❌ HandDetector test FAILED: {e}")
    import traceback
    traceback.print_exc()
