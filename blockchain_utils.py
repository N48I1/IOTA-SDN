import json
import yaml
from web3 import Web3
import logging
import ssl
import urllib3

class Blockchain:
    def __init__(self, config_file='config.yml'):
        # Set up logging first
        logging.basicConfig(
            level=logging.INFO,  # Changed to INFO for general logs
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(__name__)

        # Load configuration
        try:
            with open(config_file, 'r') as f:
                self.config = yaml.safe_load(f)
            self.logger.info(f"Configuration loaded successfully from {config_file}")
        except FileNotFoundError:
            self.logger.error(f"Config file not found at {config_file}")
            raise
        except Exception as e:
            self.logger.error(f"Failed to load config from {config_file}: {str(e)}")
            raise

        # Initialize Web3 with SSL verification disabled for development
        try:
            # Create a custom HTTP provider with SSL verification disabled
            provider = Web3.HTTPProvider(
                self.config['blockchain']['iota_evm_url'],
                request_kwargs={'verify': False}  # Disable SSL verification
            )
            self.web3 = Web3(provider)
            
            if not self.web3.is_connected():
                raise Exception("Failed to connect to IOTA EVM")
            self.logger.info("Connected to IOTA EVM successfully")
        except Exception as e:
            self.logger.error(f"Failed to connect to IOTA EVM at {self.config['blockchain']['iota_evm_url']}: {str(e)}")
            raise

        # Contract addresses
        self.access_control_address = self.config['blockchain']['contract_address']
        self.authority_contract_address = self.config['blockchain']['authority_contract_address']

        # Load ABI files and initialize contracts
        try:
            with open(r'abi/AccessControl.json', 'r') as f:
                self.access_control_abi = json.load(f)
            self.access_control = self.web3.eth.contract(
                address=self.web3.to_checksum_address(self.access_control_address),
                abi=self.access_control_abi
            )
            self.logger.info(f"AccessControl contract initialized at {self.access_control_address}")
        except FileNotFoundError:
            self.logger.error("AccessControl.json not found. Make sure it's in the same directory.")
            raise
        except Exception as e:
            self.logger.error(f"Failed to load AccessControl ABI or initialize contract: {str(e)}")
            raise

        try:
            with open(r'abi/authority.json', 'r') as f:
                self.authority_abi = json.load(f)
            self.authority_contract = self.web3.eth.contract(
                address=self.web3.to_checksum_address(self.authority_contract_address),
                abi=self.authority_abi
            )
            self.logger.info(f"Authority contract initialized at {self.authority_contract_address}")
        except FileNotFoundError:
            self.logger.error("authority.json not found. Make sure it's in the same directory.")
            raise
        except Exception as e:
            self.logger.error(f"Failed to load Authority ABI or initialize contract: {str(e)}")
            raise

        self.network = self.config['network']

    def is_connected(self):
        return self.web3.is_connected()

    def check_certificate_validity(self, address=None):
        try:
            if address is None:
                address = self.network['sdn_authority']
            address = self.web3.to_checksum_address(address)
            result = self.authority_contract.functions.isCertificateValid(address).call()
            self.logger.info(f"Certificate validity check for {address}: {result}")
            return result
        except Exception as e:
            self.logger.error(f"Error checking certificate validity for {address}: {str(e)}")
            return False

    def check_access(self, source, target):
        try:
            source = self.web3.to_checksum_address(source)
            target = self.web3.to_checksum_address(target)
            result = self.access_control.functions.checkAccess(source, target).call()
            self.logger.info(f"Access check from {source} to {target}: {result}")
            return result
        except Exception as e:
            self.logger.error(f"Error checking access from {source} to {target}: {str(e)}")
            return False

    def get_addresses(self):
        return self.network
