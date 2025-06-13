from flask import Flask, jsonify, request
from blockchain_utils import Blockchain
import logging

# Set up logging for the Flask app
logging.basicConfig(
    level=logging.INFO, # Use INFO for production, DEBUG for development
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
app = Flask(__name__)

# Initialize blockchain outside of the health check to ensure it's ready
try:
    blockchain = Blockchain()
    logger.info("Blockchain utility initialized successfully.")
except Exception as e:
    logger.error(f"Failed to initialize Blockchain utility: {str(e)}")
    blockchain = None # Set to None to indicate failure

@app.route('/health')
def health_check():
    if blockchain and blockchain.is_connected():
        return jsonify({
            "status": "running",
            "web3_connected": True
        })
    else:
        return jsonify({
            "status": "degraded",
            "web3_connected": False,
            "message": "Blockchain connection not established or failed during initialization."
        }), 503

@app.route('/check_certificate/<address>')
def check_certificate(address):
    try:
        if not blockchain:
            return jsonify({"error": "Blockchain not initialized"}), 503
        valid = blockchain.check_certificate_validity(address)
        return jsonify({
            "certificate_valid": valid,
            "address": address
        })
    except Exception as e:
        logger.error(f"Error in check_certificate: {str(e)}")
        return jsonify({
            "error": str(e)
        }), 500

@app.route('/check_access/<source>/<target>')
def check_access(source, target):
    try:
        if not blockchain:
            return jsonify({"error": "Blockchain not initialized"}), 503
        access = blockchain.check_access(source, target)
        return jsonify({
            "access_granted": access,
            "source": source,
            "target": target
        })
    except Exception as e:
        logger.error(f"Error in check_access: {str(e)}")
        return jsonify({
            "error": str(e)
        }), 500

@app.route('/check_all')
def check_all():
    try:
        if not blockchain:
            return jsonify({"error": "Blockchain not initialized"}), 503
            
        addresses = blockchain.get_addresses()
        if not addresses:
            return jsonify({"error": "No network addresses configured"}), 500

        cert_valid = blockchain.check_certificate_validity()
        controller_to_switch = blockchain.check_access(addresses['controller'], addresses['switch1'])
        switch_to_switch = blockchain.check_access(addresses['switch1'], addresses['switch2'])

        return jsonify({
            "certificate_valid": cert_valid,
            "controller_to_switch1": controller_to_switch,
            "switch1_to_switch2": switch_to_switch,
            "addresses": addresses
        })
    except Exception as e:
        logger.error(f"Error in check_all: {str(e)}")
        return jsonify({
            "error": str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
