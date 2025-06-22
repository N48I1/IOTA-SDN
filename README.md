<pre style="color: red;">
                        ██╗ ██████╗ ████████╗ █████╗       ███████╗██████╗ ███╗   ██╗
                        ██║██╔═══██╗╚══██╔══╝██╔══██╗      ██╔════╝██╔══██╗████╗  ██║
                        ██║██║   ██║   ██║   ███████║█████╗███████╗██║  ██║██╔██╗ ██║
                        ██║██║   ██║   ██║   ██╔══██║╚════╝╚════██║██║  ██║██║╚██╗██║
                        ██║╚██████╔╝   ██║   ██║  ██║      ███████║██████╔╝██║ ╚████║
                        ╚═╝ ╚═════╝    ╚═╝   ╚═╝  ╚═╝      ╚══════╝╚═════╝ ╚═╝  ╚═══╝
</pre>
![Demo](assets/demo.gif)
**IOTA 2.0 Smart Contracts for Securing Software-Defined Networking Ecosystem**

This project aims to enhance SDN security using IOTA 2.0 smart contracts, ensuring scalability, efficiency, and protection against cyber threats such as unauthorized access and DoS attacks.

 **Key Highlights of Our Project:**

✅ Implementing smart contracts for Access Control, Authority Management, and DoS Detection  
✅ Leveraging the IOTA Tangle for feeless transactions and decentralized security  
✅ Simulating and testing the system with Mininet & iotaEVM

## Overview

**IOTA-SDN** is a research and demonstration project that integrates Software-Defined Networking (SDN) with blockchain-based access control using IOTA EVM smart contracts. The project leverages Mininet for network emulation, Ryu as the SDN controller, and a custom blockchain server to enforce security policies and certificate validation in a programmable network environment.

## Features

- **Custom Mininet Topology**: Emulates a network with two OpenFlow switches, a Linux router, and multiple hosts.
- **Ryu SDN Controller**: Controls the network, queries the blockchain for access control and certificate validation, and enforces dynamic security policies.
- **Blockchain Server**: Flask-based API server that interacts with IOTA EVM smart contracts to check device certificates and access permissions.
- **Smart Contracts**: Solidity contracts for authority and access control, deployed on IOTA EVM.
- **Automated Orchestration**: A comprehensive `main.sh` script to launch, verify, and clean up all components.
- **Logging**: Centralized logs for the blockchain server, controller, and topology for easy debugging and auditing.

## Project Structure

```
.
├── abi/                  # ABI files for smart contracts
├── blockchain_server.py  # Flask server for blockchain API
├── blockchain_utils.py   # Utilities for blockchain interaction
├── config.yml            # Configuration for blockchain and network
├── contracts/            # Solidity smart contracts
├── logs/                 # Log files for server, controller, and topology
├── main.sh               # Main orchestration script
├── network.py            # Custom Mininet topology
├── ryu_controller.py     # Ryu SDN controller app
├── ryu-env/              # Python virtual environment for Ryu
├── ryu-env-py39/         # (Optional) Python 3.9 virtual environment for Ryu
└── test_server.py        # (Optional) Test utilities for the blockchain server
```

## How It Works

1. **Blockchain Server** (`blockchain_server.py`):  
   - Provides REST APIs to check device certificates and access permissions.
   - Connects to IOTA EVM using Web3 and interacts with deployed smart contracts.
   - Logs all requests and responses for traceability.

2. **Ryu Controller** (`ryu_controller.py`):  
   - Waits for the blockchain server to be ready.
   - On switch connection, validates the SDN authority's certificate via the blockchain.
   - Forwards packets only if access is granted by the blockchain smart contract.

3. **Mininet Topology** (`network.py`):  
   - Defines a two-switch, one-router, four-host topology.
   - Hosts are connected to switches, which are interconnected via a router.

4. **Smart Contracts** (`contracts/`):  
   - `AccessControl.sol`: Manages access permissions between network entities.
   - `Authority.sol`: Manages certificate issuance and validation.

5. **Orchestration Script** (`main.sh`):  
   - Performs pre-flight checks (dependencies, files, permissions).
   - Launches the blockchain server and Ryu controller in separate terminals.
   - Verifies blockchain health, certificate validity, and access rules.
   - Starts Mininet with the custom topology.
   - Cleans up all processes and Mininet state on exit.

## Getting Started

### Prerequisites

- Python 3.8+ (recommended: 3.9 for Ryu)
- Mininet
- Ryu SDN Framework
- jq (`sudo apt-get install jq`)
- IOTA EVM testnet access

### Setup

1. **Install Python dependencies**  
   Activate the provided virtual environment or create your own:
   ```bash
   python3 -m venv ryu-env
   source ryu-env/bin/activate
   pip install -r requirements.txt  # (create this file as needed)
   ```

2. **Configure the project**  
   Edit `config.yml` to set your IOTA EVM node URL, contract addresses, and network addresses.

3. **Deploy Smart Contracts**  
   Deploy the contracts in `contracts/` to IOTA EVM and update the addresses in `config.yml`.

4. **Run the Orchestration Script**  
   ```bash
   chmod +x main.sh
   ./main.sh
   ```
   Follow the prompts to launch each component.

## Logs

- All logs are stored in the `logs/` directory for post-mortem analysis.

## Customization

- **Topology**: Modify `network.py` to change the network structure.
- **Access Policies**: Update and redeploy the smart contracts in `contracts/`.
- **Controller Logic**: Extend `ryu_controller.py` for advanced SDN features.

## License

This project is for research and educational purposes.
