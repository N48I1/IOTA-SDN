from flask import Flask, jsonify, request
import requests
import json
import os
from dotenv import load_dotenv
from utils.blockchain_utils import BlockchainUtils

# Load environment variables
load_dotenv()

app = Flask(__name__)
blockchain_utils = BlockchainUtils()

@app.route('/health')
def health_check():
    """Check if the blockchain server is ready"""
    try:
        response = requests.get('http://127.0.0.1:5000/health')
        return jsonify({"status": "ready" if response.status_code == 200 else "not ready"})
    except:
        return jsonify({"status": "not ready"})

@app.route('/check_certificate/<address>')
def check_certificate(address):
    """Check if a device has a valid certificate"""
    try:
        is_valid = blockchain_utils.check_certificate(address)
        return jsonify({"valid": is_valid})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/check_access/<source>/<target>')
def check_access(source, target):
    """Check if source device has access to target device"""
    try:
        has_access = blockchain_utils.check_access(source, target)
        return jsonify({"allowed": has_access})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/check_all')
def check_all():
    """Get overall system status"""
    try:
        # Get certificate status
        controller_address = os.getenv('CONTROLLER_ADDRESS')
        controller_cert = blockchain_utils.check_certificate(controller_address)
        
        # Get access control status
        access_status = {
            "controller_to_s1": blockchain_utils.check_access(controller_address, "s1"),
            "s1_to_controller": blockchain_utils.check_access("s1", controller_address),
            "controller_to_s2": blockchain_utils.check_access(controller_address, "s2"),
            "s2_to_controller": blockchain_utils.check_access("s2", controller_address),
            "s1_to_s2": blockchain_utils.check_access("s1", "s2"),
            "s2_to_s1": blockchain_utils.check_access("s2", "s1")
        }
        
        return jsonify({
            "certificate_status": {
                "controller": "VALID" if controller_cert else "INVALID"
            },
            "access_control_status": access_status
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000) 