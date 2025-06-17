import os
import datetime
import secrets
import json
from functools import wraps
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail, Message
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from eth_account.messages import encode_defunct
from web3 import Web3
# from web3.middleware import geth_poa_middleware # Commented out as PoA is auto-handled in web3.py v6+
import subprocess # Import subprocess
from config import BLOCKCHAIN_CONFIG # Import BLOCKCHAIN_CONFIG from config.py

# --- Configuration ---

FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://192.168.1.8:8080')
SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your-secret-key')
SEND_EMAIL = os.getenv('SEND_EMAIL', '0') == '1'  # Désactive l'envoi d'email par défaut
OWNER_PRIVATE_KEY = os.getenv('OWNER_PRIVATE_KEY')

if not OWNER_PRIVATE_KEY:
    print("WARNING: OWNER_PRIVATE_KEY environment variable is not set! Transactions requiring signing will fail.")
else:
    print(f"OWNER_PRIVATE_KEY loaded (first 5 chars): {OWNER_PRIVATE_KEY[:5]}...")

# Web3 setup
try:
    w3 = Web3(Web3.HTTPProvider(BLOCKCHAIN_CONFIG['providerUrl']))
    # Check connection
    if not w3.is_connected():
        print(f"WARNING: Not connected to blockchain provider!")
    else:
        print(f"Connected to blockchain: {BLOCKCHAIN_CONFIG['providerUrl']}")
except Exception as e:
    print(f"WARNING: Failed to connect to blockchain provider: {e}")

# Derive owner account and address once if private key is set and w3 is connected
OWNER_ACCOUNT = None
OWNER_ADDRESS = None
if OWNER_PRIVATE_KEY and w3.is_connected(): # Ensure w3 is initialized and connected
    try:
        OWNER_ACCOUNT = w3.eth.account.from_key(OWNER_PRIVATE_KEY)
        OWNER_ADDRESS = OWNER_ACCOUNT.address
        print(f"OWNER_ADDRESS derived: {OWNER_ADDRESS}")
    except Exception as e:
        print(f"ERROR: Could not derive OWNER_ADDRESS from OWNER_PRIVATE_KEY: {e}")
elif not OWNER_PRIVATE_KEY:
    print("WARNING: OWNER_PRIVATE_KEY environment variable is not set! Transactions requiring signing will fail and contract calls with owner-only access might fail.")
else:
    print("WARNING: w3 is not connected, OWNER_ADDRESS could not be derived.")

# Liste des adresses Ethereum autorisées
AUTHORIZED_ADDRESSES = [
    "0x175E7264D97a4B406df9EDAC8f7B7b7eB50DA0ae",  # Remplacez par les adresses autorisées
]

# Define the lists of controllers and switches for comprehensive checks
CONTROLLERS = [BLOCKCHAIN_CONFIG['controller1']]
ALL_SWITCHES = [BLOCKCHAIN_CONFIG['switch1'], BLOCKCHAIN_CONFIG['switch2']]

# --- Flask App & Extensions ---

app = Flask(__name__)
CORS(app, origins=[FRONTEND_URL], supports_credentials=True)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users_v2.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')

# Load ABIs
print(f"[DEBUG] Attempting to load Authority ABI from: {BLOCKCHAIN_CONFIG['authorityAbiFile']}")
with open(BLOCKCHAIN_CONFIG['authorityAbiFile'], 'r') as f:
    AUTHORITY_ABI = json.load(f)
print(f"[DEBUG] Successfully loaded Authority ABI. First few entries: {AUTHORITY_ABI[:2]}")

access_control_abi_path = BLOCKCHAIN_CONFIG['accessControlAbiFile']
print(f"[DEBUG] Attempting to load AccessControl ABI from: {access_control_abi_path}")
with open(access_control_abi_path, 'r') as f:
    ACCESS_CONTROL_ABI = json.load(f)
print(f"[DEBUG] Successfully loaded AccessControl ABI. Checking for 'grantSwitchAccess': {'grantSwitchAccess' in [func['name'] for func in ACCESS_CONTROL_ABI if 'name' in func]}. Full ABI length: {len(ACCESS_CONTROL_ABI)}")

# Contract instances
AuthorityContract = w3.eth.contract(address=w3.to_checksum_address(BLOCKCHAIN_CONFIG['authorityContractAddress']), abi=AUTHORITY_ABI)
AccessControlContract = w3.eth.contract(address=w3.to_checksum_address(BLOCKCHAIN_CONFIG['accessControlContractAddress']), abi=ACCESS_CONTROL_ABI)

# --- DB & Mail ---
db = SQLAlchemy(app)
mail = Mail(app)

# --- Models ---
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    eth_address = db.Column(db.String(42), unique=True)
    reset_token = db.Column(db.String(100), unique=True)
    reset_token_expiry = db.Column(db.DateTime)
    is_authorized = db.Column(db.Boolean, default=False)  # Nouveau champ pour le statut d'autorisation
    is_admin = db.Column(db.Boolean, default=False)  # Nouveau champ pour les administrateurs

# --- JWT Helpers ---
def create_token(user_id):
    payload = {
        'user_id': user_id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def verify_token(token):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token manquant'}), 401
        try:
            token = token.split(' ')[1]
            payload = verify_token(token)
            if not payload:
                return jsonify({'message': 'Token invalide ou expiré'}), 401
        except Exception:
            return jsonify({'message': 'Token invalide'}), 401
        return f(*args, **kwargs)
    return decorated

# --- MetaMask signature verification ---
def verify_signature(address, signature, message):
    try:
        message_hash = encode_defunct(text=message)
        recovered_address = Web3().eth.account.recover_message(message_hash, signature=signature)
        return recovered_address.lower() == address.lower()
    except Exception:
        return False

# --- Blockchain Helpers (New) ---
def to_checksum_address_safe(address):
    if address and address.startswith('0x') and len(address) == 42:
        try:
            return w3.to_checksum_address(address)
        except ValueError:
            return None
    return None

def send_signed_transaction(function_call, private_key, nonce=None):
    try:
        if not w3.is_connected():
            return {"status": "error", "message": "Not connected to blockchain provider."}

        owner_account = w3.eth.account.from_key(private_key)
        
        if nonce is None:
            nonce = w3.eth.get_transaction_count(owner_account.address)

        # Estimate gas for the transaction
        # Ensure that the owner_account.address is used as 'from' address for gas estimation
        # estimated_gas = function_call.estimate_gas({'from': owner_account.address})
        estimated_gas = 300000 # Increased gas limit for testing
        
        # Build transaction
        transaction = function_call.build_transaction({
            'from': owner_account.address,
            'nonce': nonce,
            'gas': estimated_gas, # Use estimated gas
            'gasPrice': w3.eth.gas_price
        })

        # Sign transaction
        signed_txn = w3.eth.account.sign_transaction(transaction, private_key)

        app.logger.info(f"Type of signed_txn: {type(signed_txn)}")
        app.logger.info(f"Content of signed_txn (as dict): {dict(signed_txn) if hasattr(signed_txn, 'keys') else signed_txn}")
        app.logger.info(f"Has raw_transaction attribute: {'raw_transaction' in dir(signed_txn)}")

        # Send transaction
        tx_hash = w3.eth.send_raw_transaction(signed_txn.raw_transaction)
        
        # Wait for transaction receipt
        tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

        if tx_receipt.status == 1:
            return {"status": "success", "transactionHash": tx_hash.hex()}
        else:
            return {"status": "error", "message": "Transaction failed on blockchain.", "transactionHash": tx_hash.hex()}
    except Exception as e:
        app.logger.error(f"Error sending signed transaction: {e}")
        return {"status": "error", "message": str(e)}

def check_certificate_validity(address):
    try:
        # Convert address to checksum address for the contract call
        checksum_address = to_checksum_address_safe(address)
        if not checksum_address:
            print(f"Invalid address for certificate validity check: {address}")
            return {"address": address, "isValid": False}

        is_valid = AuthorityContract.functions.isCertificateValid(checksum_address).call()
        return {"address": address, "isValid": is_valid}
    except Exception as e:
        print(f"Error checking certificate validity for {address}: {e}")
        return {"address": address, "isValid": False}

# Replace the access control functions in your auth_server.py with these corrected versions:

def check_access_controller_to_switch(controller_address, switch_address):
    try:
        c_checksum = to_checksum_address_safe(controller_address)
        s_checksum = to_checksum_address_safe(switch_address)
        if not c_checksum or not s_checksum:
            app.logger.error(f"Invalid controller ({controller_address}) or switch ({switch_address}) address for C-S access check.")
            return {"source": controller_address, "target": switch_address, "status": False}
        
        # Pass the owner's address as 'from' for the call
        call_options = {'from': OWNER_ADDRESS} if OWNER_ADDRESS else {}
        status = AccessControlContract.functions.accessControl(c_checksum, s_checksum).call(call_options)
        app.logger.debug(f"Controller-Switch Access ({controller_address} -> {switch_address}): {status}")
        return {"source": controller_address, "target": switch_address, "status": status}
    except Exception as e:
        app.logger.error(f"Error checking controller-switch access ({controller_address} -> {switch_address}): {e}")
        return {"source": controller_address, "target": switch_address, "status": False}

def check_access_switch_to_switch(switch1_address, switch2_address):
    try:
        s1_checksum = to_checksum_address_safe(switch1_address)
        s2_checksum = to_checksum_address_safe(switch2_address)
        if not s1_checksum or not s2_checksum:
            app.logger.error(f"Invalid switch address for S-S access check: Source={switch1_address}, Target={switch2_address}")
            return {"source": switch1_address, "target": switch2_address, "status": False}

        # Pass the owner's address as 'from' for the call
        call_options = {'from': OWNER_ADDRESS} if OWNER_ADDRESS else {}
        status = AccessControlContract.functions.accessControl(s1_checksum, s2_checksum).call(call_options)
        app.logger.debug(f"Switch-Switch Access ({switch1_address} -> {switch2_address}): {status}")
        return {"source": switch1_address, "target": switch2_address, "status": status}
    except Exception as e:
        app.logger.error(f"Error checking switch-switch access ({switch1_address} -> {switch2_address}): {e}")
        return {"source": switch1_address, "target": switch2_address, "status": False}

def check_access_controller_to_controller(source_controller_address, target_controller_address):
    try:
        c1_checksum = to_checksum_address_safe(source_controller_address)
        c2_checksum = to_checksum_address_safe(target_controller_address)
        if not c1_checksum or not c2_checksum:
            app.logger.error(f"Invalid controller address for C-C access check: Source={source_controller_address}, Target={target_controller_address}")
            return {"source": source_controller_address, "target": target_controller_address, "status": False}

        # Pass the owner's address as 'from' for the call
        call_options = {'from': OWNER_ADDRESS} if OWNER_ADDRESS else {}
        status = AccessControlContract.functions.accessControl(c1_checksum, c2_checksum).call(call_options)
        app.logger.debug(f"Controller-Controller Access ({source_controller_address} -> {target_controller_address}): {status}")
        return {"source": source_controller_address, "target": target_controller_address, "status": status}
    except Exception as e:
        app.logger.error(f"Error checking controller-controller access ({source_controller_address} -> {target_controller_address}): {e}")
        return {"source": source_controller_address, "target": target_controller_address, "status": False}

# --- Routes ---

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    eth_address = data.get('eth_address')
    signature = data.get('signature')
    
    if not all([username, email, password, eth_address, signature]):
        return jsonify({'message': 'Tous les champs sont requis'}), 400
    
    # Vérifier la signature de l'adresse Ethereum
    # message = "Welcome to IOTASDN"
    # if not verify_signature(eth_address, signature, message):
    #     return jsonify({'message': 'Signature Ethereum invalide'}), 401
    
    if User.query.filter_by(username=username).first():
        return jsonify({'message': 'Nom d\'utilisateur déjà utilisé'}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({'message': 'Email déjà utilisé'}), 400
    if User.query.filter_by(eth_address=eth_address).first():
        return jsonify({'message': 'Adresse Ethereum déjà utilisée'}), 400
    
    user = User(
        username=username,
        email=email,
        password_hash=generate_password_hash(password),
        eth_address=eth_address,
        is_authorized=True  # Nouveau compte autorisé par défaut
    )
    db.session.add(user)
    db.session.commit()
    
    return jsonify({
        'message': 'Inscription réussie. En attente d\'autorisation par un administrateur.',
        'status': 'pending'
    })

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    if not email or not password:
        return jsonify({'message': 'Email ou mot de passe manquant'}), 400
    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'message': 'Email ou mot de passe invalide'}), 401
    token = create_token(user.id)
    return jsonify({'token': token})

@app.route('/api/auth/metamask-login', methods=['POST'])
def metamask_login():
    data = request.get_json()
    address = data.get('address')
    signature = data.get('signature')
    
    if not address or not signature:
        return jsonify({'message': 'Adresse ou signature manquante'}), 400
    
    # message = "Welcome to IOTASDN"
    # if not verify_signature(address, signature, message):
    #     return jsonify({'message': 'Signature MetaMask invalide'}), 401
    
    user = User.query.filter_by(eth_address=address).first()
    if not user:
        return jsonify({'message': "Compte non trouvé. Veuillez vous inscrire d'abord."}), 404
    
    # if not user.is_authorized:
    #     return jsonify({'message': 'Votre compte est en attente d'autorisation'}), 403
    
    token = create_token(user.id)
    return jsonify({'token': token})

@app.route('/api/auth/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email')
    if not email:
        return jsonify({'message': 'Email requis'}), 400
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'message': 'Email non trouvé'}), 404
    reset_token = secrets.token_urlsafe(32)
    user.reset_token = reset_token
    user.reset_token_expiry = datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    db.session.commit()
    reset_url = f"{FRONTEND_URL}/reset-password?token={reset_token}"
    if SEND_EMAIL:
        msg = Message('Password Reset Request', sender='noreply@yourdomain.com', recipients=[user.email])
        msg.body = f'Pour réinitialiser votre mot de passe, cliquez ici : {reset_url}'
        mail.send(msg)
    print(f"[DEV] Lien de réinitialisation : {reset_url}")
    return jsonify({'message': 'Si cet email existe, un lien a été envoyé.'})

@app.route('/api/auth/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    token = data.get('token')
    new_password = data.get('new_password')
    if not token or not new_password:
        return jsonify({'message': 'Token ou nouveau mot de passe manquant'}), 400
    user = User.query.filter_by(reset_token=token).first()
    if not user or user.reset_token_expiry < datetime.datetime.utcnow():
        return jsonify({'message': 'Token invalide ou expiré'}), 400
    user.password_hash = generate_password_hash(new_password)
    user.reset_token = None
    user.reset_token_expiry = None
    db.session.commit()
    return jsonify({'message': 'Mot de passe réinitialisé'})

@app.route('/api/auth/verify', methods=['GET'])
@token_required
def verify():
    token = request.headers.get('Authorization').split(' ')[1]
    payload = verify_token(token)
    user = User.query.get(payload['user_id'])
    return jsonify({
        'username': user.username,
        'email': user.email,
        'eth_address': user.eth_address
    })

@app.route('/api/network/ping', methods=['POST'])
@token_required
def ping_target():
    data = request.get_json()
    target = data.get('target')
    if not target:
        return jsonify({'message': 'Cible pour le ping manquante'}), 400

    # Basic validation to prevent simple command injection
    # More robust validation might be needed depending on requirements
    if ';' in target or '&' in target or '|' in target:
         return jsonify({'message': 'Cible invalide contenant des caractères spéciaux'}), 400

    try:
        # Execute ping command (using -c 4 for 4 packets, adjust as needed)
        # Note: ping command options can vary between OS (Linux/Windows)
        # This example uses Linux syntax (-c)
        command = ['ping', '-c', '4', target]
        process = subprocess.run(command, capture_output=True, text=True, timeout=10)
        
        # Combine stdout and stderr for the output
        output = process.stdout + process.stderr

        return jsonify({'output': output})

    except FileNotFoundError:
        return jsonify({'message': 'Commande ping non trouvée sur le serveur.'}), 500
    except subprocess.TimeoutExpired:
         return jsonify({'message': 'La commande ping a expiré.'}), 500
    except Exception as e:
        print(f"Error executing ping command: {e}")
        return jsonify({'message': f'Erreur interne du serveur lors de l\'exécution du ping: {e}'}), 500

# Nouvelle route pour les administrateurs
@app.route('/api/admin/users', methods=['GET'])
@token_required
def get_users():
    # Vérifier si l'utilisateur est admin
    token = request.headers.get('Authorization').split(' ')[1]
    payload = verify_token(token)
    admin_user = User.query.get(payload['user_id'])
    
    if not admin_user or not admin_user.is_admin:
        return jsonify({'message': 'Accès non autorisé'}), 403
    
    users = User.query.all()
    return jsonify([{
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'eth_address': user.eth_address,
        'is_authorized': user.is_authorized,
        'is_admin': user.is_admin
    } for user in users])

@app.route('/api/admin/authorize/<int:user_id>', methods=['POST'])
@token_required
def authorize_user(user_id):
    # Vérifier si l'utilisateur est admin
    token = request.headers.get('Authorization').split(' ')[1]
    payload = verify_token(token)
    admin_user = User.query.get(payload['user_id'])
    
    if not admin_user or not admin_user.is_admin:
        return jsonify({'message': 'Accès non autorisé'}), 403
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'Utilisateur non trouvé'}), 404
    
    user.is_authorized = True
    db.session.commit()
    
    return jsonify({'message': 'Utilisateur autorisé avec succès'})

# Créer un utilisateur admin par défaut
def create_admin_user():
    admin = User.query.filter_by(is_admin=True).first()
    if not admin:
        admin = User(
            username='admin',
            email='admin@iotasdn.com',
            password_hash=generate_password_hash('admin123'),  # À changer en production
            eth_address='0x0000000000000000000000000000000000000000',  # Adresse par défaut
            is_authorized=True,
            is_admin=True
        )
        db.session.add(admin)
        db.session.commit()

@app.route('/api/blockchain/status', methods=['GET'])
@token_required
def get_blockchain_status():
    try:
        # Get user ID from JWT token
        token = request.headers.get('Authorization').split(' ')[1]
        payload = verify_token(token)
        user = User.query.get(payload['user_id'])
        
        if not user or not user.eth_address:
            cert_status = {"address": "N/A", "isValid": False, "message": "Aucune adresse Ethereum de l'utilisateur connecté."}
        else:
            cert_status = check_certificate_validity(user.eth_address)

        # Fetch access control statuses
        controller_switch_access = check_access_controller_to_switch(BLOCKCHAIN_CONFIG['controller1'], BLOCKCHAIN_CONFIG['switch1'])
        switch_switch_access = check_access_switch_to_switch(BLOCKCHAIN_CONFIG['switch1'], BLOCKCHAIN_CONFIG['switch2'])
        
        # Get RPC status
        try:
            w3 = Web3(Web3.HTTPProvider(BLOCKCHAIN_CONFIG['providerUrl']))
            is_connected = w3.is_connected()
            last_block = w3.eth.block_number if is_connected else 0
        except Exception as e:
            print(f"Error connecting to RPC: {e}")
            is_connected = False
            last_block = 0

        # Get contract statuses
        try:
            authority_contract = w3.eth.contract(
                address=BLOCKCHAIN_CONFIG['authorityContractAddress'],
                abi=AUTHORITY_ABI
            )
            access_control_contract = w3.eth.contract(
                address=BLOCKCHAIN_CONFIG['accessControlContractAddress'],
                abi=ACCESS_CONTROL_ABI
            )

            authority_is_valid = authority_contract.functions.isValid().call()
            access_control_is_valid = access_control_contract.functions.isValid().call()
        except Exception as e:
            print(f"Error checking contracts: {e}")
            authority_is_valid = False
            access_control_is_valid = False

        return jsonify({
            "certificateStatus": cert_status,
            "accessStatuses": [
                controller_switch_access,
                switch_switch_access
            ],
            "networkAddresses": {
                "controller1": BLOCKCHAIN_CONFIG['controller1'],
                "controller2": BLOCKCHAIN_CONFIG['controller2'],
                "switch1": BLOCKCHAIN_CONFIG['switch1'],
                "switch2": BLOCKCHAIN_CONFIG['switch2'],
                "switch3": BLOCKCHAIN_CONFIG['switch3']
            },
            "rpcStatus": {
                "isConnected": is_connected,
                "lastBlock": last_block,
                "endpoint": BLOCKCHAIN_CONFIG['providerUrl']
            },
            "contracts": {
                "authority": {
                    "address": BLOCKCHAIN_CONFIG['authorityContractAddress'],
                    "isValid": authority_is_valid
                },
                "accessControl": {
                    "address": BLOCKCHAIN_CONFIG['accessControlContractAddress'],
                    "isValid": access_control_is_valid
                }
            }
        })
    except Exception as e:
        print(f"Error fetching blockchain status: {e}")
        return jsonify({"message": "Erreur lors de la récupération du statut blockchain"}), 500

@app.route('/api/network/status', methods=['GET'])
@token_required
def get_network_status():
    try:
        # Network Info
        last_block = w3.eth.block_number
        provider_url = BLOCKCHAIN_CONFIG['providerUrl']

        # Contract Info
        authority_contract_address = BLOCKCHAIN_CONFIG['authorityContractAddress']
        access_control_contract_address = BLOCKCHAIN_CONFIG['accessControlContractAddress']
        
        # Check contract validity (simplified for now, actual validation might be more complex)
        authority_contract_valid = False
        access_control_contract_valid = False
        try:
            # A basic check: if contract address is valid and code exists at address
            if w3.is_connected() and w3.eth.get_code(w3.to_checksum_address(authority_contract_address)):
                authority_contract_valid = True
            if w3.is_connected() and w3.eth.get_code(w3.to_checksum_address(access_control_contract_address)):
                access_control_contract_valid = True
        except Exception as e:
            print(f"Error checking contract validity: {e}")

        # Certificate Summary
        certificate_details = []
        overall_certificates_valid = True
        # For each controller/switch, check its certificate validity
        for controller_address in CONTROLLERS:
            cert_status = check_certificate_validity(controller_address)
            print(f"DEBUG: Controller Certificate Status for {controller_address}: {cert_status}")
            certificate_details.append({"entity": "Controller", "address": controller_address, "isValid": cert_status["isValid"]})
            if not cert_status["isValid"]:
                overall_certificates_valid = False
        for switch_address in ALL_SWITCHES:
            cert_status = check_certificate_validity(switch_address)
            print(f"DEBUG: Switch Certificate Status for {switch_address}: {cert_status}")
            certificate_details.append({"entity": "Switch", "address": switch_address, "isValid": cert_status["isValid"]})
            if not cert_status["isValid"]:
                overall_certificates_valid = False
        
        print(f"DEBUG: Final overall_certificates_valid: {overall_certificates_valid}")
        print(f"DEBUG: Final certificate_details: {certificate_details}")

        # Access Summary
        specific_access_details = []

        # 1. Controller 1 to Switch 1 (Existing)
        c1_addr = BLOCKCHAIN_CONFIG['controller1']
        s1_addr = BLOCKCHAIN_CONFIG['switch1']
        status_c1_s1 = check_access_controller_to_switch(c1_addr, s1_addr)
        specific_access_details.append(status_c1_s1)

        # 2. Controller 1 to Switch 2 (New: Added based on main2.py output)
        s2_addr = BLOCKCHAIN_CONFIG['switch2']
        status_c1_s2 = check_access_controller_to_switch(c1_addr, s2_addr)
        specific_access_details.append(status_c1_s2)

        # 3. Switch 0 to Switch 1 (Existing, now re-numbered)
        s0 = BLOCKCHAIN_CONFIG['switch1']
        s1 = BLOCKCHAIN_CONFIG['switch2']
        status_s0_s1 = check_access_switch_to_switch(s0, s1)
        specific_access_details.append(status_s0_s1)

        # Switch to Controller access is not relevant and will not be checked or displayed.
        
        # Overall validity for access types based on desired policy
        overall_access_valid = (
            status_c1_s1["status"] and  # Controller1 -> Switch1 must be TRUE
            status_c1_s2["status"] and  # Controller1 -> Switch2 must be TRUE
            not status_s0_s1["status"]
        )

        return jsonify({
            "network_info": {
                "provider": provider_url,
                "last_block": last_block,
            },
            "contracts": {
                "authority": {
                    "address": authority_contract_address,
                    "isValid": authority_contract_valid
                },
                "accessControl": {
                    "address": access_control_contract_address,
                    "isValid": access_control_contract_valid
                }
            },
            "certificate_details": certificate_details, # Keep existing certificate details
            "overall_certificates_valid": overall_certificates_valid, # Keep existing overall validity
            "access_details": specific_access_details, # New key for specific access details
            "overall_access_valid": overall_access_valid, # Overall validity for the specific access checks
            "networkAddresses": { # Provide full addresses for frontend to shorten
                "controller1": BLOCKCHAIN_CONFIG['controller1'],
                "switch1": BLOCKCHAIN_CONFIG['switch1'],
                "switch2": BLOCKCHAIN_CONFIG['switch2'],
            }
        })
    except Exception as e:
        print(f"Error fetching network status: {e}")
        return jsonify({"message": f"Erreur lors de la récupération du statut réseau: {e}"}), 500

@app.route('/api/contract/authority/register_cert', methods=['POST'])
@token_required
def register_certificate():
    app.logger.info(f"Received request headers: {dict(request.headers)}")
    app.logger.info(f"Received raw request data for register_cert: {request.get_data()}")

    if not request.is_json:
        app.logger.error("RegisterCert: Request is not JSON")
        return jsonify({'message': 'Request must be JSON'}), 400
        
    data = request.get_json()
    app.logger.info(f"RegisterCert: Parsed JSON data: {data}")

    if not data:
        app.logger.error("RegisterCert: Empty request body")
        return jsonify({'message': 'Empty request body'}), 400

    # Try to get address from 'address' or 'ISPs'
    address_to_certify = data.get('address') or data.get('ISPs')
    # Try to get public_key from 'publicKey' or 'public_key' or 'publicKeyHex'
    public_key_hex = data.get('publicKey') or data.get('public_key') or data.get('publicKeyHex')
    expiry = data.get('expiry') # Unix timestamp

    app.logger.info(f"RegisterCert: Extracted address: {address_to_certify}, publicKey: {public_key_hex}, expiry: {expiry}")

    if not all([address_to_certify, public_key_hex, expiry]):
        app.logger.error(f"RegisterCert: Missing data. Address: {bool(address_to_certify)}, PublicKey: {bool(public_key_hex)}, Expiry: {bool(expiry)}")
        return jsonify({'message': 'Missing data for certificate registration'}), 400

    # Remove any quotes from address if present
    address_to_certify = address_to_certify.strip('"\'')

    checksum_address = to_checksum_address_safe(address_to_certify)
    if not checksum_address:
        app.logger.error(f"RegisterCert: Invalid Ethereum address format: {address_to_certify}")
        return jsonify({'message': 'Invalid Ethereum address'}), 400

    try:
        # Ensure public_key_hex is treated as hex string correctly
        public_key_bytes = bytes.fromhex(public_key_hex.replace('0x', ''))
        if len(public_key_bytes) != 32:
            app.logger.error(f"RegisterCert: Public key must be 32 bytes (64 hex characters), got {len(public_key_bytes)} bytes")
            return jsonify({'message': 'Public key must be 32 bytes (64 hex characters)'}), 400
    except ValueError:
        app.logger.error(f"RegisterCert: Invalid public key format (must be hex): {public_key_hex}")
        return jsonify({'message': 'Invalid public key format (must be hex)'}), 400

    try:
        expiry_uint = int(expiry)
    except ValueError:
        app.logger.error(f"RegisterCert: Expiry must be an integer (Unix timestamp), got {expiry}")
        return jsonify({'message': 'Expiry must be an integer (Unix timestamp)'}), 400

    try:
        function_call = AuthorityContract.functions.RegisterCert(checksum_address, public_key_bytes, expiry_uint)
        result = send_signed_transaction(function_call, OWNER_PRIVATE_KEY)

        if result['status'] == 'success':
            app.logger.info(f"RegisterCert: Certificate registered successfully for address: {address_to_certify}")
            return jsonify({'message': 'Certificate registered successfully', 'transactionHash': result['transactionHash']}), 200
        else:
            app.logger.error(f"RegisterCert: Transaction failed: {result['message']}")
            return jsonify({'message': result['message']}), 500
    except Exception as e:
        app.logger.error(f"RegisterCert: Error during RegisterCert: {e}")
        return jsonify({'message': f'Failed to register certificate: {str(e)}'}), 500

@app.route('/api/contract/authority/revoke_cert', methods=['POST'])
@token_required
def revoke_certificate():
    app.logger.info(f"Received request headers: {dict(request.headers)}")
    app.logger.info(f"Received request data: {request.get_data()}")
    
    if not request.is_json:
        app.logger.error("Request is not JSON")
        return jsonify({'message': 'Request must be JSON'}), 400
        
    data = request.get_json()
    app.logger.info(f"Parsed JSON data: {data}")
    
    if not data:
        app.logger.error("Empty request body")
        return jsonify({'message': 'Empty request body'}), 400
    
    # Accept both 'address' and 'ISPs' parameters
    address_to_revoke = data.get('address') or data.get('ISPs')
    app.logger.info(f"Address to revoke: {address_to_revoke}")
    
    if not address_to_revoke:
        app.logger.error("Missing address in request")
        return jsonify({'message': 'Missing address for certificate revocation'}), 400

    # Remove any quotes if present
    address_to_revoke = address_to_revoke.strip('"\'')
    
    checksum_address = to_checksum_address_safe(address_to_revoke)
    if not checksum_address:
        app.logger.error(f"Invalid Ethereum address format: {address_to_revoke}")
        return jsonify({'message': f'Invalid Ethereum address format: {address_to_revoke}'}), 400

    try:
        function_call = AuthorityContract.functions.revoke(checksum_address)
        result = send_signed_transaction(function_call, OWNER_PRIVATE_KEY)

        if result['status'] == 'success':
            app.logger.info(f"Certificate revoked successfully for address: {address_to_revoke}")
            return jsonify({'message': 'Certificate revoked successfully', 'transactionHash': result['transactionHash']}), 200
        else:
            app.logger.error(f"Transaction failed: {result['message']}")
            return jsonify({'message': result['message']}), 500
    except Exception as e:
        app.logger.error(f"Error during revoke: {e}")
        return jsonify({'message': f'Failed to revoke certificate: {str(e)}'}), 500

@app.route('/api/contract/authority/is_valid_cert', methods=['POST', 'GET'])
@token_required
def get_certificate_validity():
    # Accept both 'address' and 'ISPs' parameters
    address_to_check = request.args.get('address') or request.args.get('ISPs') or request.get_json().get('address') or request.get_json().get('ISPs')
    
    if not address_to_check:
        return jsonify({'message': 'Missing address to check validity'}), 400
    
    # Remove any quotes if present
    address_to_check = address_to_check.strip('"\'')
    
    checksum_address = to_checksum_address_safe(address_to_check)
    if not checksum_address:
        return jsonify({'message': 'Invalid Ethereum address'}), 400
    
    try:
        is_valid = AuthorityContract.functions.isCertificateValid(checksum_address).call()
        return jsonify({'address': address_to_check, 'isValid': is_valid}), 200
    except Exception as e:
        app.logger.error(f"Error checking certificate validity: {e}")
        return jsonify({'message': f'Failed to check certificate validity: {str(e)}'}), 500

@app.route('/api/contract/authority/transfer_ownership', methods=['POST'])
@token_required
def transfer_ownership_route():
    data = request.get_json()
    new_owner_address = data.get('newOwnerAddress')
    private_key = data.get('privateKey') # Assuming private key is passed for signing

    if not new_owner_address or not private_key:
        return jsonify({'message': 'Missing new owner address or private key'}), 400

    new_owner_checksum = to_checksum_address_safe(new_owner_address)
    if not new_owner_checksum:
        return jsonify({'message': 'Invalid new owner address format'}), 400

    try:
        function_call = AuthorityContract.functions.transferOwnership(new_owner_checksum)
        result = send_signed_transaction(function_call, private_key)
        return jsonify(result), 200
    except Exception as e:
        app.logger.error(f"Error transferring ownership: {e}")
        return jsonify({'message': str(e)}), 500

@app.route('/api/contract/authority/cert_revo_list', methods=['GET'])
@token_required
def get_cert_revo_list():
    try:
        revoked_certs = AuthorityContract.functions.cert_revo_list().call()
        return jsonify({'status': 'success', 'revokedCertificates': revoked_certs}), 200
    except Exception as e:
        app.logger.error(f"Error fetching revoked certificate list: {e}")
        return jsonify({'message': str(e)}), 500

@app.route('/api/contract/authority/is_valid', methods=['GET'])
@token_required
def get_authority_contract_validity():
    try:
        is_valid = AuthorityContract.functions.isValid().call()
        return jsonify({'status': 'success', 'isValid': is_valid}), 200
    except Exception as e:
        app.logger.error(f"Error checking Authority contract validity: {e}")
        return jsonify({'message': str(e)}), 500

@app.route('/api/contract/access_control/add_controller', methods=['POST'])
@token_required
def add_controller_route():
    app.logger.info(f"AddController: Received request headers: {dict(request.headers)}")
    app.logger.info(f"AddController: Received raw request data: {request.get_data()}")

    if not request.is_json:
        app.logger.error("AddController: Request is not JSON")
        return jsonify({'message': 'Request must be JSON'}), 400
        
    data = request.get_json()
    app.logger.info(f"AddController: Parsed JSON data: {data}")

    if not data:
        app.logger.error("AddController: Empty request body")
        return jsonify({'message': 'Empty request body'}), 400

    controller_address = data.get('controllerAddress')
    app.logger.info(f"AddController: Extracted controllerAddress: {controller_address}")

    if not controller_address:
        app.logger.error("AddController: Missing controller address in request")
        return jsonify({'message': 'Missing controller address'}), 400

    checksum_address = to_checksum_address_safe(controller_address)
    app.logger.info(f"AddController: Checksum address: {checksum_address}")

    if not checksum_address:
        app.logger.error(f"AddController: Invalid Ethereum address format: {controller_address}")
        return jsonify({'message': 'Invalid Ethereum address'}), 400

    try:
        function_call = AccessControlContract.functions.addController(checksum_address)
        app.logger.info(f"AddController: Calling send_signed_transaction with function_call: {function_call} and OWNER_PRIVATE_KEY status: {bool(OWNER_PRIVATE_KEY)}")
        result = send_signed_transaction(function_call, OWNER_PRIVATE_KEY)
        app.logger.info(f"AddController: Result of send_signed_transaction: {result}")

        if result['status'] == 'success':
            return jsonify({'message': 'Controller added successfully', 'transactionHash': result['transactionHash']}), 200
        else:
            app.logger.error(f"AddController: Transaction failed with message: {result.get('message', 'No message provided')}")
            return jsonify({'message': result['message']}), 500
    except Exception as e:
        app.logger.error(f"AddController: Error adding controller: {e}", exc_info=True)
        return jsonify({'message': f'Failed to add controller: {str(e)}'}), 500

@app.route('/api/contract/access_control/add_switch', methods=['POST'])
@token_required
def add_switch_route():
    app.logger.info(f"AddSwitch: Received request headers: {dict(request.headers)}")
    app.logger.info(f"AddSwitch: Received raw request data: {request.get_data()}")

    if not request.is_json:
        app.logger.error("AddSwitch: Request is not JSON")
        return jsonify({'message': 'Request must be JSON'}), 400

    data = request.get_json()
    app.logger.info(f"AddSwitch: Parsed JSON data: {data}")

    if not data:
        app.logger.error("AddSwitch: Empty request body")
        return jsonify({'message': 'Empty request body'}), 400

    switch_address = data.get('switchAddress')
    app.logger.info(f"AddSwitch: Extracted address: {switch_address}")

    if not switch_address:
        app.logger.error("AddSwitch: Missing switch address in request")
        return jsonify({'message': 'Missing switch address'}), 400

    checksum_address = to_checksum_address_safe(switch_address)
    app.logger.info(f"AddSwitch: Checksum address: {checksum_address}")

    if not checksum_address:
        app.logger.error(f"AddSwitch: Invalid Ethereum address format: {switch_address}")
        return jsonify({'message': 'Invalid Ethereum address'}), 400

    try:
        function_call = AccessControlContract.functions.addSwitch(checksum_address)
        app.logger.info(f"AddSwitch: Calling send_signed_transaction with function_call: {function_call} and OWNER_PRIVATE_KEY status: {bool(OWNER_PRIVATE_KEY)}")
        result = send_signed_transaction(function_call, OWNER_PRIVATE_KEY)
        app.logger.info(f"AddSwitch: Result of send_signed_transaction: {result}")

        if result['status'] == 'success':
            return jsonify({'message': 'Switch added successfully', 'transactionHash': result['transactionHash']}), 200
        else:
            app.logger.error(f"AddSwitch: Transaction failed with message: {result.get('message', 'No message provided')}")
            return jsonify({'message': result['message']}), 500
    except Exception as e:
        app.logger.error(f"AddSwitch: Error adding switch: {e}", exc_info=True)
        return jsonify({'message': f'Failed to add switch: {str(e)}'}), 500

@app.route('/api/contract/access_control/grant_access_cs', methods=['POST'])
@token_required
def grant_access_cs_route():
    data = request.get_json()
    controller_address = data.get('controllerAddress')
    switch_address = data.get('switchAddress')

    if not all([controller_address, switch_address]):
        return jsonify({'message': 'Missing controller or switch address'}), 400

    controller_checksum = to_checksum_address_safe(controller_address)
    switch_checksum = to_checksum_address_safe(switch_address)

    if not controller_checksum or not switch_checksum:
        return jsonify({'message': 'Invalid Ethereum address for controller or switch'}), 400

    try:
        function_call = AccessControlContract.functions.grantAccess(controller_checksum, switch_checksum)
        result = send_signed_transaction(function_call, OWNER_PRIVATE_KEY)

        if result['status'] == 'success':
            return jsonify({'message': 'Controller-Switch access granted successfully', 'transactionHash': result['transactionHash']}), 200
        else:
            return jsonify({'message': result['message']}), 500
    except Exception as e:
        app.logger.error(f"Error granting C-S access: {e}")
        return jsonify({'message': f'Failed to grant C-S access: {str(e)}'}), 500

@app.route('/api/contract/access_control/revoke_access_cs', methods=['POST'])
@token_required
def revoke_access_cs_route():
    data = request.get_json()
    controller_address = data.get('controllerAddress')
    switch_address = data.get('switchAddress')

    if not all([controller_address, switch_address]):
        return jsonify({'message': 'Missing controller or switch address'}), 400

    controller_checksum = to_checksum_address_safe(controller_address)
    switch_checksum = to_checksum_address_safe(switch_address)

    if not controller_checksum or not switch_checksum:
        return jsonify({'message': 'Invalid Ethereum address for controller or switch'}), 400

    try:
        function_call = AccessControlContract.functions.revokeAccess(controller_checksum, switch_checksum)
        result = send_signed_transaction(function_call, OWNER_PRIVATE_KEY)

        if result['status'] == 'success':
            return jsonify({'message': 'Controller-Switch access revoked successfully', 'transactionHash': result['transactionHash']}), 200
        else:
            return jsonify({'message': result['message']}), 500
    except Exception as e:
        app.logger.error(f"Error revoking C-S access: {e}")
        return jsonify({'message': f'Failed to revoke C-S access: {str(e)}'}), 500

@app.route('/api/contract/access_control/grant_access_cc', methods=['POST'])
@token_required
def grant_access_cc_route():
    data = request.get_json()
    from_controller_address = data.get('fromControllerAddress')
    to_controller_address = data.get('toControllerAddress')

    if not all([from_controller_address, to_controller_address]):
        return jsonify({'message': 'Missing source or target controller address'}), 400

    from_checksum = to_checksum_address_safe(from_controller_address)
    to_checksum = to_checksum_address_safe(to_controller_address)

    if not from_checksum or not to_checksum:
        return jsonify({'message': 'Invalid Ethereum address for source or target controller'}), 400

    try:
        function_call = AccessControlContract.functions.grantControllerAccess(from_checksum, to_checksum)
        result = send_signed_transaction(function_call, OWNER_PRIVATE_KEY)

        if result['status'] == 'success':
            return jsonify({'message': 'Controller-Controller access granted successfully', 'transactionHash': result['transactionHash']}), 200
        else:
            return jsonify({'message': result['message']}), 500
    except Exception as e:
        app.logger.error(f"Error granting C-C access: {e}")
        return jsonify({'message': f'Failed to grant C-C access: {str(e)}'}), 500

@app.route('/api/contract/access_control/revoke_access_cc', methods=['POST'])
@token_required
def revoke_access_cc_route():
    data = request.get_json()
    from_controller_address = data.get('fromControllerAddress')
    to_controller_address = data.get('toControllerAddress')

    if not all([from_controller_address, to_controller_address]):
        return jsonify({'message': 'Missing source or target controller address'}), 400

    from_checksum = to_checksum_address_safe(from_controller_address)
    to_checksum = to_checksum_address_safe(to_controller_address)

    if not from_checksum or not to_checksum:
        return jsonify({'message': 'Invalid Ethereum address for source or target controller'}), 400

    try:
        function_call = AccessControlContract.functions.revokeControllerAccess(from_checksum, to_checksum)
        result = send_signed_transaction(function_call, OWNER_PRIVATE_KEY)

        if result['status'] == 'success':
            return jsonify({'message': 'Controller-Controller access revoked successfully', 'transactionHash': result['transactionHash']}), 200
        else:
            return jsonify({'message': result['message']}), 500
    except Exception as e:
        app.logger.error(f"Error revoking C-C access: {e}")
        return jsonify({'message': f'Failed to revoke C-C access: {str(e)}'}), 500

@app.route('/api/contract/access_control/grant_access_ss', methods=['POST'])
@token_required
def grant_access_ss_route():
    data = request.get_json()
    switch1_address = data.get('switch1Address')
    switch2_address = data.get('switch2Address')

    if not all([switch1_address, switch2_address]):
        return jsonify({'message': 'Missing switch addresses'}), 400

    switch1_checksum = to_checksum_address_safe(switch1_address)
    switch2_checksum = to_checksum_address_safe(switch2_address)

    if not switch1_checksum or not switch2_checksum:
        return jsonify({'message': 'Invalid Ethereum address for switches'}), 400

    try:
        function_call = AccessControlContract.functions.grantSwitchAccess(switch1_checksum, switch2_checksum)
        result = send_signed_transaction(function_call, OWNER_PRIVATE_KEY)

        if result['status'] == 'success':
            return jsonify({'message': 'Switch-Switch access granted successfully', 'transactionHash': result['transactionHash']}), 200
        else:
            return jsonify({'message': result['message']}), 500
    except Exception as e:
        app.logger.error(f"Error granting S-S access: {e}")
        return jsonify({'message': f'Failed to grant S-S access: {str(e)}'}), 500

@app.route('/api/contract/access_control/revoke_access_ss', methods=['POST'])
@token_required
def revoke_access_ss_route():
    data = request.get_json()
    switch1_address = data.get('switch1Address')
    switch2_address = data.get('switch2Address')

    if not all([switch1_address, switch2_address]):
        return jsonify({'message': 'Missing switch addresses'}), 400

    switch1_checksum = to_checksum_address_safe(switch1_address)
    switch2_checksum = to_checksum_address_safe(switch2_address)

    if not switch1_checksum or not switch2_checksum:
        return jsonify({'message': 'Invalid Ethereum address for switches'}), 400

    try:
        function_call = AccessControlContract.functions.revokeSwitchAccess(switch1_checksum, switch2_checksum)
        result = send_signed_transaction(function_call, OWNER_PRIVATE_KEY)

        if result['status'] == 'success':
            return jsonify({'message': 'Switch-Switch access revoked successfully', 'transactionHash': result['transactionHash']}), 200
        else:
            return jsonify({'message': result['message']}), 500
    except Exception as e:
        app.logger.error(f"Error revoking S-S access: {e}")
        return jsonify({'message': f'Failed to revoke S-S access: {str(e)}'}), 500

@app.route('/api/contract/access_control/check_access', methods=['POST', 'GET'])
@token_required
def check_access_route():
    source_address = request.args.get('source') or request.get_json().get('source')
    target_address = request.args.get('target') or request.get_json().get('target')

    if not all([source_address, target_address]):
        return jsonify({'message': 'Missing source or target address to check access'}), 400

    source_checksum = to_checksum_address_safe(source_address)
    target_checksum = to_checksum_address_safe(target_address)

    if not source_checksum or not target_checksum:
        return jsonify({'message': 'Invalid Ethereum address for source or target'}), 400

    try:
        # Pass the owner's address as 'from' for the call
        call_options = {'from': OWNER_ADDRESS} if OWNER_ADDRESS else {}
        has_access = AccessControlContract.functions.checkAccess(source_checksum, target_checksum).call(call_options)
        return jsonify({'source': source_address, 'target': target_address, 'hasAccess': has_access}), 200
    except Exception as e:
        app.logger.error(f"Error checking access: {e}")
        return jsonify({'message': f'Failed to check access: {str(e)}'}), 500

@app.route('/api/contract/access_control/add_standby_controller', methods=['POST'])
@token_required
def add_standby_controller_route():
    data = request.get_json()
    main_controller_address = data.get('mainControllerAddress')
    standby_controller_address = data.get('standbyControllerAddress')
    private_key = data.get('privateKey')

    if not main_controller_address or not standby_controller_address or not private_key:
        return jsonify({'message': 'Missing parameters'}), 400

    main_controller_checksum = to_checksum_address_safe(main_controller_address)
    standby_controller_checksum = to_checksum_address_safe(standby_controller_address)

    if not main_controller_checksum or not standby_controller_checksum:
        return jsonify({'message': 'Invalid address format'}), 400

    try:
        function_call = AccessControlContract.functions.addStandbyController(
            main_controller_checksum,
            standby_controller_checksum
        )
        result = send_signed_transaction(function_call, private_key)
        return jsonify(result), 200
    except Exception as e:
        app.logger.error(f"Error adding standby controller: {e}")
        return jsonify({'message': str(e)}), 500

@app.route('/api/contract/access_control/remove_standby_controller', methods=['POST'])
@token_required
def remove_standby_controller_route():
    data = request.get_json()
    main_controller_address = data.get('mainControllerAddress')
    standby_controller_address = data.get('standbyControllerAddress')
    private_key = data.get('privateKey')

    if not main_controller_address or not standby_controller_address or not private_key:
        return jsonify({'message': 'Missing parameters'}), 400

    main_controller_checksum = to_checksum_address_safe(main_controller_address)
    standby_controller_checksum = to_checksum_address_safe(standby_controller_address)

    if not main_controller_checksum or not standby_controller_checksum:
        return jsonify({'message': 'Invalid address format'}), 400

    try:
        function_call = AccessControlContract.functions.removeStandbyController(
            main_controller_checksum,
            standby_controller_checksum
        )
        result = send_signed_transaction(function_call, private_key)
        return jsonify(result), 200
    except Exception as e:
        app.logger.error(f"Error removing standby controller: {e}")
        return jsonify({'message': str(e)}), 500

@app.route('/api/contract/access_control/is_valid', methods=['GET'])
@token_required
def get_access_control_contract_validity():
    try:
        is_valid = AccessControlContract.functions.isValid().call()
        return jsonify({'status': 'success', 'isValid': is_valid}), 200
    except Exception as e:
        app.logger.error(f"Error checking Access Control contract validity: {e}")
        return jsonify({'message': str(e)}), 500

# --- Main ---
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        create_admin_user()
    app.run(host='0.0.0.0', port=5000, debug=True)