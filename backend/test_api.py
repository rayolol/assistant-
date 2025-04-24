import requests
import json

def test_root_endpoint():
    """Test the root endpoint of the API"""
    response = requests.get("http://localhost:8000/")
    print("Root Endpoint Response:", response.status_code)
    print(json.dumps(response.json(), indent=2))
    print()

def test_chat_endpoint():
    """Test the chat endpoint of the API"""
    data = {"message": "Hello, how are you?"}
    response = requests.post("http://localhost:8000/chat", json=data)
    print("Chat Endpoint Response:", response.status_code)
    print(json.dumps(response.json(), indent=2))
    print()

if __name__ == "__main__":
    print("Testing FastAPI endpoints...")
    try:
        test_root_endpoint()
        test_chat_endpoint()
        print("Tests completed!")
    except Exception as e:
        print(f"Error during testing: {e}")
        print("Make sure the API server is running on http://localhost:8000")
