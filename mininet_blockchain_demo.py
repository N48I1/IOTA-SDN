from mininet.topo import Topo
from mininet.net import Mininet
from mininet.node import Controller, OVSController, RemoteController
from mininet.cli import CLI
from mininet.log import setLogLevel, info
from mininet.link import TCLink
import sys
import os
import json

from web3 import Web3

# --- CONFIGURATION ---
IOTA_RPC = "https://json-rpc.evm.testnet.iotaledger.net/"

# Initialize Web3 first to use its address formatting functions
web3 = Web3(Web3.HTTPProvider(IOTA_RPC))

# Ensure addresses are properly formatted
def format_address(addr):
    # Remove '0x' if present and ensure lowercase
    addr = addr.lower().replace('0x', '')
    # Add '0x' prefix and ensure it's 40 characters (20 bytes)
    addr = '0x' + addr.zfill(40)
    return Web3.to_checksum_address(addr)

# Format addresses
AUTHORITY_CONTRACT_ADDRESS = format_address("0xEDCc5EBd8a8b8549B4e0fd1B1f5C2DBC0B075870")
ACCESS_CONTROL_CONTRACT_ADDRESS = format_address("0x4ed5d26faffdefc5f77edd12a1d10f5da474452f") # Add Access Control contract address
SWITCHES = {
    's0': format_address("1e8ca3b2af6209b92e9181ec689447c9ec032ae3"),
    's1': format_address("de84b29a82e908f812ce153748d30aaae10713de")
}

def load_abi(path):
    try:
        with open(path) as f:
            return json.load(f)
    except FileNotFoundError:
        info(f"❌ Fichier ABI non trouvé: {path}\n")
        sys.exit(1)
    except json.JSONDecodeError:
        info(f"❌ Erreur de format JSON dans le fichier ABI: {path}\n")
        sys.exit(1)

def check_certificate_validity(web3, contract, address):
    try:
        # Get the contract code to verify deployment
        code = web3.eth.get_code(address)
        if not code:
            info(f"❌ Aucun code trouvé à l'adresse du contrat: {address}\n")
            return False

        # Try to call the contract function
        return contract.functions.isCertificateValid(address).call()
    except Exception as e:
        info(f"❌ Erreur détaillée lors de la vérification du certificat: {str(e)}\n")
        return False

class SimpleTopology(Topo):
    """Topologie simple avec 2 switches et 2 hosts"""
    
    def build(self):
        info("*** Création de la topologie personnalisée\n")
        
        # Créer les switches avec des DPIDs spécifiques
        s0 = self.addSwitch('s0', dpid='0000000000000001')  # DPID = 1
        s1 = self.addSwitch('s1', dpid='0000000000000002')  # DPID = 2
        
        # Créer les hosts
        h0 = self.addHost('h0', ip='10.0.0.1/24')
        h1 = self.addHost('h1', ip='10.0.0.2/24')
        
        # Créer les liens
        self.addLink(h0, s0, port1=0, port2=1)  # h0-eth0 <-> s0-eth1
        self.addLink(h1, s1, port1=0, port2=1)  # h1-eth0 <-> s1-eth1  
        self.addLink(s0, s1, port1=2, port2=2)  # s0-eth2 <-> s1-eth2
        
        info("*** Topologie créée: h0 -- s0 -- s1 -- h1\n")

def create_network():
    """Créer et configurer le réseau Mininet"""
    
    # Check if running as root
    if os.geteuid() != 0:
        info("❌ Mininet doit être exécuté en tant que root. Utilisez 'sudo'.\n")
        sys.exit(1)

    info("*** Création du réseau Mininet\n")
    
    # Créer la topologie
    topo = SimpleTopology()
    
    # Try to connect to remote controller first, fallback to local if not available
    try:
        # Test if remote controller is available
        import socket
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(2)
        result = sock.connect_ex(('127.0.0.1', 6653))
        sock.close()
        
        if result == 0:
            info("*** Contrôleur distant détecté sur port 6653\n")
            # Créer le réseau avec un contrôleur distant
            net = Mininet(
                topo=topo,
                controller=lambda name: RemoteController(name, ip='127.0.0.1', port=6653),
                link=TCLink,
                autoSetMacs=True,
                autoStaticArp=True
            )
        else:
            raise ConnectionError("Remote controller not available")
            
    except:
        info("*** Contrôleur distant non disponible, utilisation du contrôleur local\n")
        # Créer le réseau avec le contrôleur local par défaut
        net = Mininet(
            topo=topo,
            controller=OVSController,  # Use built-in controller
            link=TCLink,
            autoSetMacs=True,
            autoStaticArp=True
        )
    
    return net

def test_connectivity(net):
    """Tester la connectivité du réseau"""
    info("*** Test de connectivité de base\n")
    
    # Get hosts
    h0 = net.get('h0')
    h1 = net.get('h1')
    
    info("*** Configuration des hosts:\n")
    info(f"h0: IP={h0.IP()}, MAC={h0.MAC()}\n")
    info(f"h1: IP={h1.IP()}, MAC={h1.MAC()}\n")
    
    # Test ping
    info("*** Test ping h0 -> h1\n")
    result = h0.cmd(f'ping -c 1 {h1.IP()}')
    info(f"Résultat ping: {result}")
    
    return "1 received" in result

if __name__ == '__main__':
    setLogLevel('info')
    info("--- Démarrage du script Mininet ---\n")

    # Check connection
    info("--- Vérification de la connexion RPC ---\n")
    if not web3.is_connected():
        info(f"❌ Impossible de se connecter au nœud RPC: {IOTA_RPC}\n")
        sys.exit(1)
    else:
        info(f"✅ Connecté au nœud RPC: {IOTA_RPC}\n")
        info(f"Dernier bloc: {web3.eth.block_number}\n")

    info("--- Chargement et vérification des contrats blockchain ---\n")
    try:
        # Load Authority Contract ABI
        authority_abi = load_abi('abi/authority.json')
        # Address is already checksummed
        authority_contract = web3.eth.contract(address=AUTHORITY_CONTRACT_ADDRESS, abi=authority_abi)

        # Verify Authority contract deployment
        authority_code = web3.eth.get_code(AUTHORITY_CONTRACT_ADDRESS)
        if not authority_code:
            info(f"❌ Le contrat Authority n'est pas déployé à l'adresse: {AUTHORITY_CONTRACT_ADDRESS}\n")
            sys.exit(1)
        info(f"✅ Contrat Authority chargé: {AUTHORITY_CONTRACT_ADDRESS}\n")

        # Load Access Control Contract ABI
        access_control_abi = load_abi('abi/AccessControl.json') # Assuming ABI file name
        # Address is already checksummed
        access_control_contract = web3.eth.contract(address=ACCESS_CONTROL_CONTRACT_ADDRESS, abi=access_control_abi)

        # Verify Access Control contract deployment
        access_control_code = web3.eth.get_code(ACCESS_CONTROL_CONTRACT_ADDRESS)
        if not access_control_code:
             info(f"❌ Le contrat Access Control n'est pas déployé à l'adresse: {ACCESS_CONTROL_CONTRACT_ADDRESS}\n")
             sys.exit(1)
        info(f"✅ Contrat Access Control chargé: {ACCESS_CONTROL_CONTRACT_ADDRESS}\n")

    except Exception as e:
        info(f"❌ Erreur lors du chargement des contrats: {str(e)}\n") # Modified error message
        sys.exit(1)

    # Vérification des certificats AVANT de démarrer le réseau
    info("--- Vérification des certificats des switches (commenté) ---\n")
    # for sw, addr in SWITCHES.items():
    #     valid = check_certificate_validity(web3, authority_contract, addr)
    #     if valid:
    #         info(f"✅ Switch {sw} ({addr}) a un certificat VALIDE\n")
    #     else:
    #         info(f"❌ Switch {sw} ({addr}) n'a PAS de certificat valide\n")

    # Lancement de la topologie Mininet
    info("--- Lancement de la topologie Mininet ---\n")
    net = create_network()
    
    try:
        info("*** Démarrage du réseau\n")
        net.start()
        
        # Attendre un peu pour que les switches se connectent
        info("*** Attente de la connexion des switches...\n")
        import time
        time.sleep(3)
        
        # Test de connectivité automatique
        info("--- Test de connectivité automatique ---\n")
        success = test_connectivity(net)
        
        if success:
            info("✅ Test de connectivité réussi !\n")
        else:
            info("❌ Test de connectivité échoué. Vérifiez le contrôleur Ryu.\n")
            info("💡 Assurez-vous que 'ryu-manager --verbose ryu_app.py' est en cours d'exécution.\n")
        
        # Interaction avec la topologie via CLI
        info("--- Entrée dans la CLI Mininet ---\n")
        info("\nCommandes utiles:\n")
        info("  pingall       - Tester la connectivité entre tous les hosts\n")
        info("  h0 ping h1    - Ping de h0 vers h1\n")
        info("  dump          - Afficher les informations du réseau\n")
        info("  net           - Afficher la topologie\n")
        info("  exit          - Quitter\n")
        CLI(net)

    except KeyboardInterrupt:
        info("\n*** Interruption utilisateur\n")
    finally:
        # Arrêt du réseau Mininet
        info("--- Arrêt du réseau Mininet ---\n")
        net.stop()