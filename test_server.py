import urllib.request
import json
import logging

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def make_request(url):
    try:
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read().decode())
            print(f"Status: {response.getcode()}")
            print(f"Response: {json.dumps(data, indent=2)}")
            return data
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code} - {e.reason}")
        try:
            error_data = json.loads(e.read().decode())
            print(f"Error details: {json.dumps(error_data, indent=2)}")
        except:
            print("No additional error details available")
    except Exception as e:
        print(f"Error: {str(e)}")
    return None

def test_health():
    print("\nTesting health endpoint:")
    make_request('http://localhost:5000/health')

def test_access(src,dst):
    print("\nTesting access check:")

    make_request(f'http://localhost:5000/check_access/{src}/{dst}')

def test_certificate():
    print("\nTesting certificate check:")
    address = "0xC184836543aBd0B70ffb2A8083eEf57F829ACD62"  # access control certificate
    make_request(f'http://localhost:5000/check_certificate/{address}')

def test_all_checks():
    print("\nTesting all checks endpoint:")
    make_request('http://localhost:5000/check_all')

if __name__ == "__main__":
    switch1 = "0x1E9eb2b168993C1c4e79a4B1A7082a1BDA1D3234"  # SWITCH1_ADDRESS
    switch2 = "0xac7c33305CaAB6e53955876374B97ED6203AD1D7"  # SWITCH2_ADDRESS
    controller="0x7F53d082A31c065493A119800AE9B680a752b5F9"
    print("Testing blockchain server...")
    test_health()
    test_certificate()
    test_access(controller,switch1)
    test_all_checks() 