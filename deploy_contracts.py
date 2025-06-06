#!/usr/bin/env python3

import json
import os
import time
from web3 import Web3
from web3.middleware import geth_poa_middleware
from solcx import compile_standard, install_solc
import argparse

# Configuration
IOTA_RPC = "https://json-rpc.evm.testnet.iotaledger.net/"
CHAIN_ID = 1073
PRIVATE_KEY = "7354d112f673e3dbc329479d91b8e97a6b77a327389dd946227a15360a67ccb6"  # ISP private key

# Device addresses (as registered on blockchain)
CONTROLLER_1 = "0xC95449F9a0eDf900E7a91B43eA982aF6cE7C411B"  # c0
CONTROLLER_2 = "0xDc6124e3E177eFd4e809f68c59002285BaBB9499"  # c1 (optional)
SWITCH_1 = "0x1e8Ca3B2af6209b92e9181EC689447c9Ec032Ae3"      # s0
SWITCH_2 = "0xde84b29a82E908f812Ce153748d30aaae10713dE"      # s1
ISP_ADDRESS = "0x4997332d52e039073956cf5AEC4Ca960550cba85"   # ISP address (owner)

def connect_to_blockchain():
    """Connect to the blockchain network"""
    web3 = Web3(Web3.HTTPProvider(IOTA_RPC))
    
    # Add middleware for POA chains if needed
    web3.middleware_onion.inject(geth_poa_middleware, layer=0)
    
    if not web3.is_connected():
        raise ConnectionError("Failed to connect to the blockchain network")
    
    print(f"Connected to network: {web3.is_connected()}")
    print(f"Chain ID: {web3.eth.chain_id}")
    
    return web3

def compile_contract(contract_name, solidity_version="0.8.19"):
    """Compile a Solidity contract and return the compiled content"""
    # Install the appropriate solidity compiler
    install_solc(solidity_version)
    
    # Read the contract source
    with open(f"{contract_name}.sol", "r") as file:
        contract_source = file.read()
    
    # Compile the contract
    compiled_sol = compile_standard(
        {
            "language": "Solidity",
            "sources": {f"{contract_name}.sol": {"content": contract_source}},
            "settings": {
                "outputSelection": {
                    "*": {"*": ["abi", "metadata", "evm.bytecode", "evm.sourceMap"]}
                }
            },
        },
        solc_version=solidity_version,
    )
    
    # Extract bytecode and ABI
    bytecode = compiled_sol["contracts"][f"{contract_name}.sol"][contract_name]["evm"]["bytecode"]["object"]
    abi = compiled_sol["contracts"][f"{contract_name}.sol"][contract_name]["abi"]
    
    # Save ABI to file
    os.makedirs("abi", exist_ok=True)
    with open(f"abi/{contract_name}.json", "w") as f:
        json.dump(abi, f, indent=2)
    
    return bytecode, abi

def deploy_contract(web3, account, bytecode, abi, constructor_args=[]):
    """Deploy a contract to the blockchain"""
    # Create contract instance
    contract = web3.eth.contract(abi=abi, bytecode=bytecode)
    
    # Build transaction
    tx = contract.constructor(*constructor_args).build_transaction(
        {
            "chainId": web3.eth.chain_id,
            "from": account.address,
            "nonce": web3.eth.get_transaction_count(account.address),
            "gasPrice": web3.eth.gas_price,
        }
    )
    
    # Sign transaction
    signed_tx = web3.eth.account.sign_transaction(tx, private_key=PRIVATE_KEY)
    
    # Send transaction
    tx_hash = web3.eth.send_raw_transaction(signed_tx.rawTransaction)
    print(f"Deployment transaction sent: {tx_hash.hex()}")
    
    # Wait for transaction to be mined
    print("Waiting for transaction to be mined...")
    tx_receipt = web3.eth.wait_for_transaction_receipt(tx_hash)
    
    # Get contract address
    contract_address = tx_receipt.contractAddress
    print(f"Contract deployed at: {contract_address}")
    
    return tx_receipt.contractAddress

def setup_authority(web3, account, authority_address):
    """Set up the Authority contract with certificates"""
    # Create contract instance
    with open("abi/Authority.json", "r") as f:
        abi = json.load(f)
        
    authority = web3.eth.contract(address=authority_address, abi=abi)
    
    # Issue certificate to ISP
    pub_key = web3.keccak(text="ISP_PUBLIC_KEY")
    expiry = int(time.time()) + 60 * 60 * 24 * 365  # Valid for 1 year
    
    # Build transaction
    tx = authority.functions.RegisterCert(
        ISP_ADDRESS,
        pub_key,
        expiry
    ).build_transaction(
        {
            "chainId": web3.eth.chain_id,
            "from": account.address,
            "nonce": web3.eth.get_transaction_count(account.address),
            "gasPrice": web3.eth.gas_price,
        }
    )
    
    # Sign transaction
    signed_tx = web3.eth.account.sign_transaction(tx, private_key=PRIVATE_KEY)
    
    # Send transaction
    tx_hash = web3.eth.send_raw_transaction(signed_tx.rawTransaction)
    print(f"Certificate registration transaction sent: {tx_hash.hex()}")
    
    # Wait for transaction to be mined
    tx_receipt = web3.eth.wait_for_transaction_receipt(tx_hash)
    print(f"Certificate registered for ISP: {tx_receipt.status == 1}")

def setup_access_control(web3, account, access_control_address, authority_address):
    """Set up the AccessControl contract with permissions"""
    # Create contract instance
    with open("abi/AccessControl.json", "r") as f:
        abi = json.load(f)
        
    access_control = web3.eth.contract(address=access_control_address, abi=abi)
    
    # Set up transactions
    transactions = [
        # Add controllers
        access_control.functions.addController(CONTROLLER_1),
        access_control.functions.addController(CONTROLLER_2),
        
        # Add switches
        access_control.functions.addSwitch(SWITCH_1),
        access_control.functions.addSwitch(SWITCH_2),
        
        # Grant access permissions
        access_control.functions.grantAccess(CONTROLLER_1, SWITCH_1),
        access_control.functions.grantAccess(CONTROLLER_1, SWITCH_2),
        access_control.functions.grantAccess(CONTROLLER_1, CONTROLLER_2),
        access_control.functions.grantAccess(SWITCH_1, SWITCH_2),
    ]
    
    # Execute each transaction
    for tx_index, tx_func in enumerate(transactions):
        # Build transaction
        tx = tx_func.build_transaction(
            {
                "chainId": web3.eth.chain_id,
                "from": account.address,
                "nonce": web3.eth.get_transaction_count(account.address) + tx_index,
                "gasPrice": web3.eth.gas_price,
            }
        )
        
        # Sign transaction
        signed_tx = web3.eth.account.sign_transaction(tx, private_key=PRIVATE_KEY)
        
        # Send transaction
        tx_hash = web3.eth.send_raw_transaction(signed_tx.rawTransaction)
        print(f"AccessControl setup transaction {tx_index+1}/{len(transactions)} sent: {tx_hash.hex()}")
        
        # Wait for transaction to be mined
        tx_receipt = web3.eth.wait_for_transaction_receipt(tx_hash)
        print(f"Transaction {tx_index+1} status: {'Success' if tx_receipt.status == 1 else 'Failed'}")
        
def setup_security_monitor(web3, account, security_monitor_address, log_manager_address):
    """Set up the SecurityMonitor contract with initial devices"""
    # Create contract instance
    with open("abi/SecurityMonitor.json", "r") as f:
        abi = json.load(f)
        
    security_monitor = web3.eth.contract(address=security_monitor_address, abi=abi)
    
    # Authorize devices in the security monitor
    devices = [CONTROLLER_1, CONTROLLER_2, SWITCH_1, SWITCH_2]
    
    for i, device in enumerate(devices):
        # Build transaction
        tx = security_monitor.functions.authorizeDevice(
            device
        ).build_transaction(
            {
                "chainId": web3.eth.chain_id,
                "from": account.address,
                "nonce": web3.eth.get_transaction_count(account.address) + i,
                "gasPrice": web3.eth.gas_price,
            }
        )
        
        # Sign transaction
        signed_tx = web3.eth.account.sign_transaction(tx, private_key=PRIVATE_KEY)
        
        # Send transaction
        tx_hash = web3.eth.send_raw_transaction(signed_tx.rawTransaction)
        print(f"Authorizing device {device} in SecurityMonitor: {tx_hash.hex()}")
        
        # Wait for transaction to be mined
        tx_receipt = web3.eth.wait_for_transaction_receipt(tx_hash)
        print(f"Device authorization status: {'Success' if tx_receipt.status == 1 else 'Failed'}")

def main():
    """Main function to deploy and configure all contracts"""
    parser = argparse.ArgumentParser(description='Deploy and configure blockchain contracts for SDN security')
    parser.add_argument('--deploy-all', action='store_true', help='Deploy all contracts from scratch')
    parser.add_argument('--authority', help='Use existing Authority contract address')
    parser.add_argument('--access-control', help='Use existing AccessControl contract address')
    parser.add_argument('--log-manager', help='Use existing LogManager contract address')
    parser.add_argument('--security-monitor', help='Use existing SecurityMonitor contract address')
    parser.add_argument('--setup-only', action='store_true', help='Only configure existing contracts')
    
    args = parser.parse_args()
    
    # Connect to blockchain
    web3 = connect_to_blockchain()
    account = web3.eth.account.from_key(PRIVATE_KEY)
    print(f"Using account: {account.address}")
    
    contract_addresses = {}
    
    if not args.setup_only or args.deploy_all:
        # Deploy Authority contract if needed
        if args.deploy_all or not args.authority:
            print("\n--- Deploying Authority Contract ---")
            bytecode, abi = compile_contract("Authority")
            authority_address = deploy_contract(web3, account, bytecode, abi)
            contract_addresses['Authority'] = authority_address
        else:
            authority_address = args.authority
            contract_addresses['Authority'] = authority_address
        
        # Deploy LogManager contract if needed
        if args.deploy_all or not args.log_manager:
            print("\n--- Deploying LogManager Contract ---")
            bytecode, abi = compile_contract("LogManager")
            # Log manager needs the owner address
            log_manager_address = deploy_contract(web3, account, bytecode, abi, [account.address])
            contract_addresses['LogManager'] = log_manager_address
        else:
            log_manager_address = args.log_manager
            contract_addresses['LogManager'] = log_manager_address
        
        # Deploy AccessControl contract if needed
        if args.deploy_all or not args.access_control:
            print("\n--- Deploying AccessControl Contract ---")
            bytecode, abi = compile_contract("AccessControl")
            # AccessControl needs Authority address and ISP address
            access_control_address = deploy_contract(web3, account, bytecode, abi, [authority_address, ISP_ADDRESS])
            contract_addresses['AccessControl'] = access_control_address
        else:
            access_control_address = args.access_control
            contract_addresses['AccessControl'] = access_control_address
        
        # Deploy SecurityMonitor contract if needed
        if args.deploy_all or not args.security_monitor:
            print("\n--- Deploying SecurityMonitor Contract ---")
            bytecode, abi = compile_contract("SecurityMonitor")
            # SecurityMonitor needs LogManager address
            security_monitor_address = deploy_contract(web3, account, bytecode, abi, [log_manager_address])
            contract_addresses['SecurityMonitor'] = security_monitor_address
        else:
            security_monitor_address = args.security_monitor
            contract_addresses['SecurityMonitor'] = security_monitor_address
    else:
        # Use existing contract addresses
        authority_address = args.authority
        access_control_address = args.access_control
        log_manager_address = args.log_manager
        security_monitor_address = args.security_monitor
        
        contract_addresses['Authority'] = authority_address
        contract_addresses['AccessControl'] = access_control_address
        contract_addresses['LogManager'] = log_manager_address
        contract_addresses['SecurityMonitor'] = security_monitor_address
    
    # Save contract addresses to file
    with open('contract_addresses.json', 'w') as f:
        json.dump(contract_addresses, f, indent=2)
    print(f"\nContract addresses saved to contract_addresses.json")
    
    # Setup contracts
    print("\n--- Setting up Authority Contract ---")
    setup_authority(web3, account, authority_address)
    
    print("\n--- Setting up AccessControl Contract ---")
    setup_access_control(web3, account, access_control_address, authority_address)
    
    print("\n--- Setting up SecurityMonitor Contract ---")
    setup_security_monitor(web3, account, security_monitor_address, log_manager_address)
    
    print("\n--- Contract Setup Complete ---")
    print("You can now run the main network script with these contracts")
    
if __name__ == "__main__":
    main()