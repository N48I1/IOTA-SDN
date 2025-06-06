from mininet.node import Controller
from web3 import Web3
import json
import time

class BlockchainController(Controller):
    """Custom controller that integrates with blockchain for security checks"""
    
    def __init__(self, name, blockchain_address, 
                 web3_provider="https://json-rpc.evm.testnet.iotaledger.net/",
                 authority_contract="0x8859CEA6f5F0DF05252D132F2f0bae5fF73Ed90F",
                 access_control_contract="0x217f3c3C1859Ae5CF316679Ac3831ECAD97eee08",
                 security_monitor_contract="0xYourSecurityMonitorAddress",
                 **kwargs):
        Controller.__init__(self, name, **kwargs)
        self.blockchain_address = blockchain_address
        self.web3_provider = web3_provider
        self.authority_contract = authority_contract
        self.access_control_contract = access_control_contract
        self.security_monitor_contract = security_monitor_contract
        self.nonce = 1
        
        # Initialize Web3 connection
        self.web3 = None
        self.authority = None
        self.access_control = None
        self.security_monitor = None
        
    def start(self):
        """Start the controller and initialize blockchain connection"""
        # Start regular controller
        Controller.start(self)
        
        # Initialize blockchain connection
        try:
            self.web3 = Web3(Web3.HTTPProvider(self.web3_provider))
            if not self.web3.is_connected():
                raise ConnectionError(f"Failed to connect to blockchain at {self.web3_provider}")
            
            # Load contract ABIs
            with open('abi/authority.json') as f:
                authority_abi = json.load(f)
            with open('abi/AccessControl.json') as f:
                access_control_abi = json.load(f)
            with open('abi/SecurityMonitor.json') as f:
                security_monitor_abi = json.load(f)
                
            # Initialize contracts
            self.authority = self.web3.eth.contract(
                address=self.authority_contract, 
                abi=authority_abi
            )
            self.access_control = self.web3.eth.contract(
                address=self.access_control_contract, 
                abi=access_control_abi
            )
            self.security_monitor = self.web3.eth.contract(
                address=self.security_monitor_contract, 
                abi=security_monitor_abi
            )
            
            # Record controller startup in security monitor
            self.record_action("controller_start")
            
            print(f"Controller {self.name} blockchain integration initialized")
            
        except Exception as e:
            print(f"⚠️ Blockchain integration for controller {self.name} failed: {e}")
    
    def record_action(self, action_type):
        """Record an action in the security monitor"""
        # In a real implementation, you would sign this transaction with the controller's private key
        try:
            # This is a simplified example - in a real implementation, 
            # you would need to sign and send a transaction
            print(f"Recording action '{action_type}' for controller {self.name} with nonce {self.nonce}")
            # self.security_monitor.functions.performAction(
            #     self.blockchain_address, 
            #     self.nonce
            # ).call()
            self.nonce += 1
        except Exception as e:
            print(f"Failed to record action: {e}")
    
    def authorize_switch(self, switch_address):
        """Check if this controller is authorized to control the switch"""
        try:
            return self.access_control.functions.checkAccess(
                self.blockchain_address,
                switch_address
            ).call()
        except Exception as e:
            print(f"Authorization check failed: {e}")
            return False