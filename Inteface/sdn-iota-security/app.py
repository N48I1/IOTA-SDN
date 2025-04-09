from flask import Flask, render_template, request, jsonify, redirect, url_for, session, flash
import os
from web3 import Web3
import json
from functools import wraps

app = Flask(__name__)
app.secret_key = os.urandom(24)

# Configuration Web3
w3 = Web3(Web3.HTTPProvider('http://localhost:8545'))  # Remplacer par votre fournisseur Ethereum

# Configuration des comptes (à remplacer par vos adresses réelles)
AUTHORITY_ADDRESS = "0x94F6D50D4a103046F2ad1Dc05278c0b96Cb83bFF"
ACCESS_CONTROL_ADDRESS = "0x9C522A5573Be3f6924f4aCC165d25Ed5F9698bf9"
DOS_DETECTOR_ADDRESS = "0xfE9eAa4dF4C24A101Db65eC5e48B0ED11cCA5539"

# ABI des contrats (à remplacer par vos ABI réels)
# Ceci est un exemple simplifié
with open('../contracts/Authority.json', 'r') as file:
    authority_json = json.load(file)
    AUTHORITY_ABI = authority_json['abi']

with open('../contracts/AccessControl.json', 'r') as file:
    access_control_json = json.load(file)
    ACCESS_CONTROL_ABI = access_control_json['abi']

with open('../contracts/DosDetector.json', 'r') as file:
    dos_detector_json = json.load(file)
    DOS_DETECTOR_ABI = dos_detector_json['abi']

# Initialisation des contrats
authority_contract = w3.eth.contract(address=AUTHORITY_ADDRESS, abi=AUTHORITY_ABI)
access_control_contract = w3.eth.contract(address=ACCESS_CONTROL_ADDRESS, abi=ACCESS_CONTROL_ABI)
dos_detector_contract = w3.eth.contract(address=DOS_DETECTOR_ADDRESS, abi=DOS_DETECTOR_ABI)

# Liste des utilisateurs autorisés (pour démonstration)
USERS = {
    "admin": {"password": "admin123", "role": "admin"},
    "user": {"password": "user123", "role": "user"}
}

# Décorateur pour vérifier si l'utilisateur est connecté
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'logged_in' not in session:
            flash('Veuillez vous connecter pour accéder à cette page', 'warning')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

# Décorateur pour vérifier les rôles
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if session.get('role') != 'admin':
            flash('Accès refusé. Privilèges administrateur requis.', 'danger')
            return redirect(url_for('dashboard'))
        return f(*args, **kwargs)
    return decorated_function

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        if username in USERS and USERS[username]['password'] == password:
            session['logged_in'] = True
            session['username'] = username
            session['role'] = USERS[username]['role']
            flash(f'Bienvenue, {username}!', 'success')
            return redirect(url_for('dashboard'))
        else:
            flash('Identifiants incorrects', 'danger')
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    flash('Vous avez été déconnecté', 'info')
    return redirect(url_for('login'))

@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html')

@app.route('/verify-authority', methods=['GET', 'POST'])
@login_required
def verify_authority():
    result = None
    if request.method == 'POST':
        authority_id = request.form.get('authority_id')
        try:
            # Exemple de vérification d'autorité via contrat intelligent
            is_valid = authority_contract.functions.verifyAuthority(authority_id).call()
            result = {
                'authority_id': authority_id,
                'is_valid': is_valid,
                'timestamp': w3.eth.get_block('latest').timestamp
            }
        except Exception as e:
            flash(f'Erreur lors de la vérification: {str(e)}', 'danger')
    
    return render_template('verify_authority.html', result=result)

@app.route('/access-control')
@login_required
def access_control():
    # Récupérer les informations de contrôle d'accès depuis le contrat
    try:
        access_rules = []
        rule_count = access_control_contract.functions.getRuleCount().call()
        
        for i in range(rule_count):
            rule = access_control_contract.functions.getRule(i).call()
            access_rules.append(rule)
            
        return render_template('access_control.html', access_rules=access_rules)
    except Exception as e:
        flash(f'Erreur lors de la récupération des règles: {str(e)}', 'danger')
        return render_template('access_control.html', access_rules=[])

@app.route('/dos-detection')
@login_required
@admin_required
def dos_detection():
    # Récupérer les informations de détection DoS depuis le contrat
    try:
        dos_alerts = []
        alert_count = dos_detector_contract.functions.getAlertCount().call()
        
        for i in range(alert_count):
            alert = dos_detector_contract.functions.getAlert(i).call()
            dos_alerts.append(alert)
            
        return render_template('dos_detection.html', dos_alerts=dos_alerts)
    except Exception as e:
        flash(f'Erreur lors de la récupération des alertes: {str(e)}', 'danger')
        return render_template('dos_detection.html', dos_alerts=[])

@app.route('/connect-metamask', methods=['POST'])
@login_required
def connect_metamask():
    address = request.json.get('address')
    if not address:
        return jsonify({'success': False, 'message': 'Aucune adresse fournie'})
    
    session['metamask_address'] = address
    return jsonify({'success': True, 'message': 'Connexion à Metamask réussie'})

@app.route('/api/check-authority/<address>')
@login_required
def api_check_authority(address):
    try:
        is_valid = authority_contract.functions.isValidAuthority(address).call()
        return jsonify({'is_valid': is_valid})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/iota-status')
@login_required
def iota_status():
    # Cette fonction serait connectée à votre nœud IOTA
    # Implémentation simplifiée pour l'exemple
    return render_template('iota_status.html', status={
        'network': 'Connected',
        'node_id': 'IOTA-Node-XYZ',
        'transactions': 1243,
        'confirmations_rate': '98.7%'
    })

if __name__ == '__main__':
    app.run(debug=True)