import os
import datetime
import secrets
from functools import wraps
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail, Message
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from eth_account.messages import encode_defunct
from web3 import Web3
import subprocess # Import subprocess

# --- Configuration ---

FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:8080')
SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your-secret-key')
SEND_EMAIL = os.getenv('SEND_EMAIL', '0') == '1'  # Désactive l'envoi d'email par défaut

# --- Flask App & Extensions ---

app = Flask(__name__)
CORS(app, origins=[FRONTEND_URL], supports_credentials=True)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')

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

# --- Routes ---

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    if not all([username, email, password]):
        return jsonify({'message': 'Champs requis manquants'}), 400
    if User.query.filter_by(username=username).first() or User.query.filter_by(email=email).first():
        return jsonify({'message': 'Utilisateur ou email déjà existant'}), 400
    user = User(username=username, email=email, password_hash=generate_password_hash(password))
    db.session.add(user)
    db.session.commit()
    token = create_token(user.id)
    return jsonify({'token': token, 'message': 'Inscription réussie'})

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
    message = "Welcome to IOTASDN"
    if not verify_signature(address, signature, message):
        return jsonify({'message': 'Signature MetaMask invalide'}), 401
    user = User.query.filter_by(eth_address=address).first()
    if not user:
        user = User(username=f"user_{address[:8]}", email=f"{address[:8]}@metamask.com", eth_address=address)
        db.session.add(user)
        db.session.commit()
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

# --- Main ---
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=5000)