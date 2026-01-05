import mediapipe as mp
import os
import sys
from pathlib import Path

# Add project root to path
root_dir = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(root_dir))

print(f"Python Version: {sys.version}")
print(f"Mediapipe Version: {mp.__version__}")
print(f"Mediapipe Path: {mp.__file__}")

base_path = os.path.dirname(mp.__file__)
print(f"Base Path Contents: {os.listdir(base_path)}")

# Check possible locations for solutions
look_for = ['solutions', 'python/solutions', 'python/solutions/hands']
for loc in look_for:
    full_path = os.path.join(base_path, *loc.split('/'))
    exists = os.path.exists(full_path)
    print(f"Location {loc} exists: {exists}")
    if exists:
        print(f"Contents of {loc}: {os.listdir(full_path)}")

# Try direct imports
try:
    import mediapipe.solutions.hands as hands
    print("SUCCESS: Imported mediapipe.solutions.hands")
except ImportError as e:
    print(f"FAILED: mediapipe.solutions.hands: {e}")

try:
    from mediapipe.python.solutions import hands
    print("SUCCESS: Imported mediapipe.python.solutions.hands")
except ImportError as e:
    print(f"FAILED: mediapipe.python.solutions.hands: {e}")

try:
    from mediapipe.tasks.python import vision
    print("SUCCESS: Imported mediapipe.tasks.python.vision")
except ImportError as e:
    print(f"FAILED: mediapipe.tasks.python.vision: {e}")
