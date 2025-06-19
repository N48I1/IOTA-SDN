from flask import Flask, jsonify, request
from blockchain_utils import Blockchain
import logging
import sys
import os

# Create logs directory if it doesn't exist
os.makedirs('logs', exist_ok=True)

# Set up logging for the Flask app
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('logs/blockchain_server.log', mode='w')  # 'w' mode to overwrite previous logs
    ]
)
logger = logging.getLogger(__name__)

# Print startup message
print("\n=== Blockchain Server Starting ===")
print("Logs will be written to logs/blockchain_server.log")
print("===================================\n")

app = Flask(__name__)

# Initialize blockchain outside of the health check to ensure it's ready
try:
    blockchain = Blockchain()
    logger.info("Blockchain utility initialized successfully.")
    print("Blockchain utility initialized successfully.")
except Exception as e:
    logger.error(f"Failed to initialize Blockchain utility: {str(e)}")
    print(f"Failed to initialize Blockchain utility: {str(e)}")
    blockchain = None  # Set to None to indicate failure

@app.before_request
def log_request_info():
    logger.debug('Headers: %s', request.headers)
    logger.debug('Body: %s', request.get_data())
    print(f"\nIncoming request: {request.method} {request.path}")

@app.after_request
def log_response_info(response):
    logger.debug('Response: %s', response.get_data())
    print(f"Response status: {response.status_code}")
    return response

@app.route('/health')
def health_check():
    logger.info("Health check request received")
    print("\n=== Health Check ===")
    if blockchain and blockchain.is_connected():
        logger.info("Health check: Blockchain is connected")
        print("Blockchain is connected")
        return jsonify({
            "status": "running",
            "web3_connected": True
        })
    else:
        logger.warning("Health check: Blockchain is not connected")
        print("Blockchain is not connected")
        return jsonify({
            "status": "degraded",
            "web3_connected": False,
            "message": "Blockchain connection not established or failed during initialization."
        }), 503

@app.route('/check_certificate/<address>')
def check_certificate(address):
    logger.info(f"Certificate check request received for address: {address}")
    print(f"\n=== Certificate Check ===")
    print(f"Checking certificate for address: {address}")
    try:
        if not blockchain:
            logger.error("Blockchain not initialized")
            print("Error: Blockchain not initialized")
            return jsonify({"error": "Blockchain not initialized"}), 503
        valid = blockchain.check_certificate_validity(address)
        logger.info(f"Certificate check result for {address}: {valid}")
        print(f"Certificate valid: {valid}")
        return jsonify({
            "certificate_valid": valid,
            "address": address
        })
    except Exception as e:
        logger.error(f"Error in check_certificate: {str(e)}")
        print(f"Error: {str(e)}")
        return jsonify({
            "error": str(e)
        }), 500

@app.route('/check_access/<source>/<target>')
def check_access(source, target):
    logger.info(f"Access check request received: {source} -> {target}")
    print(f"\n=== Access Check ===")
    print(f"Checking access: {source} -> {target}")
    try:
        if not blockchain:
            logger.error("Blockchain not initialized")
            print("Error: Blockchain not initialized")
            return jsonify({"error": "Blockchain not initialized"}), 503
        access = blockchain.check_access(source, target)
        logger.info(f"Access check result: {source} -> {target} = {access}")
        print(f"Access granted: {access}")
        return jsonify({
            "access_granted": access,
            "source": source,
            "target": target
        })
    except Exception as e:
        logger.error(f"Error in check_access: {str(e)}")
        print(f"Error: {str(e)}")
        return jsonify({
            "error": str(e)
        }), 500

@app.route('/check_all')
def check_all():
    logger.info("Check all request received")
    print("\n=== Check All ===")
    try:
        if not blockchain:
            logger.error("Blockchain not initialized")
            print("Error: Blockchain not initialized")
            return jsonify({"error": "Blockchain not initialized"}), 503
            
        addresses = blockchain.get_addresses()
        if not addresses:
            logger.error("No network addresses configured")
            print("Error: No network addresses configured")
            return jsonify({"error": "No network addresses configured"}), 500

        cert_valid = blockchain.check_certificate_validity()
        controller_to_switch = blockchain.check_access(addresses['controller'], addresses['switch1'])
        switch_to_switch = blockchain.check_access(addresses['switch1'], addresses['switch2'])

        logger.info(f"Check all results: cert_valid={cert_valid}, controller_to_switch={controller_to_switch}, switch_to_switch={switch_to_switch}")
        print(f"Certificate valid: {cert_valid}")
        print(f"Controller to Switch1 access: {controller_to_switch}")
        print(f"Switch1 to Switch2 access: {switch_to_switch}")
        return jsonify({
            "certificate_valid": cert_valid,
            "controller_to_switch1": controller_to_switch,
            "switch1_to_switch2": switch_to_switch,
            "addresses": addresses
        })
    except Exception as e:
        logger.error(f"Error in check_all: {str(e)}")
        print(f"Error: {str(e)}")
        return jsonify({
            "error": str(e)
        }), 500

if __name__ == '__main__':
    print("\nStarting blockchain server on http://127.0.0.1:5000")
    app.run(host='127.0.0.1', port=5000, debug=False)
 