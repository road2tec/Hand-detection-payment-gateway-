import requests
import sys
from pathlib import Path

# Add project root to path
root_dir = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(root_dir))

def check_backend():
    print("Checking Backend Health...")
    try:
        response = requests.get("http://localhost:8000/")
        print(f"Status: {response.status_code}, Response: {response.json()}")
    except Exception as e:
        print(f"FAILED: Could not connect to backend: {e}")

def test_registration():
    print("\nTesting Registration API...")
    payload = {
        "name": "Test User",
        "email": "test@example.com",
        "password": "Password123!"
    }
    try:
        response = requests.post("http://localhost:8000/auth/register", json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"FAILED: Registration request failed: {e}")

if __name__ == "__main__":
    check_backend()
    test_registration()
