import sys
import requests
import socket
from pathlib import Path

# Add project root to path
root_dir = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(root_dir))

print("Testing Backend Connectivity...")
print(f"Python version: {sys.version}")

# Test 1: Root endpoint
try:
    response = requests.get("http://localhost:8000/")
    print(f"✅ Root endpoint: {response.status_code} - {response.json()}")
except Exception as e:
    print(f"❌ Root endpoint failed: {e}")

# Test 2: Check if server is listening
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
result = sock.connect_ex(('localhost', 8000))
if result == 0:
    print("✅ Port 8000 is open")
else:
    print("❌ Port 8000 is closed")
sock.close()

# Test 3: CORS preflight
try:
    headers = {"Origin": "http://localhost:5173", "Access-Control-Request-Method": "POST"}
    response = requests.options("http://localhost:8000/biometric/verify-hand", headers=headers)
    print(f"✅ CORS preflight: {response.status_code}")
    print(f"   Access-Control-Allow-Origin: {response.headers.get('Access-Control-Allow-Origin')}")
except Exception as e:
    print(f"❌ CORS preflight failed: {e}")
