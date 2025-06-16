BLOCKCHAIN_CONFIG = {
    'providerUrl': 'https://json-rpc.evm.testnet.iotaledger.net/',
    'controller1': '0x94F6D50D4a103046F2ad1Dc05278c0b96Cb83bFF',
    'controller2': '0xC95449F9a0eDf900E7a91B43eA982aF6cE7C411B',
    'switch1': '0x1e8ca3b2af6209b92e9181ec689447c9ec032ae3',
    'switch2': '0xde84b29a82e908f812ce153748d30aaae10713de',
    'switch3': '0x5678901234567890123456789012345678901234',
    'authorityContractAddress': '0xeFa530f657A219f85516E9A5647A7906E00A2556',
    'accessControlContractAddress': '0x5519662Fc635E7da301418C9B212e9680724187f',
    'authorityAbiFile': 'abi/authority.json',
    'accessControlAbiFile': 'abi/AccessControl.json'
}

# Contract ABIs
AUTHORITY_ABI = [
    {
        "inputs": [],
        "name": "isValid",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "certificate", "type": "address"}],
        "name": "isCertificateValid",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "certificate", "type": "address"}],
        "name": "revokeCertificate",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
]

ACCESS_CONTROL_ABI = [
    {
        "inputs": [
            {"internalType": "address", "name": "", "type": "address"},
            {"internalType": "address", "name": "", "type": "address"}
        ],
        "name": "accessControl",
        "outputs": [
            {"internalType": "bool", "name": "", "type": "bool"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "isValid",
        "outputs": [
            {"internalType": "bool", "name": "", "type": "bool"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "address", "name": "_controllerAddress", "type": "address"},
            {"internalType": "address", "name": "_switchAddress", "type": "address"}
        ],
        "name": "checkAccess",
        "outputs": [
            {"internalType": "bool", "name": "", "type": "bool"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "address", "name": "switch1", "type": "address"},
            {"internalType": "address", "name": "switch2", "type": "address"}
        ],
        "name": "checkSwitchAccess",
        "outputs": [
            {"internalType": "bool", "name": "", "type": "bool"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "address", "name": "controller1", "type": "address"},
            {"internalType": "address", "name": "controller2", "type": "address"}
        ],
        "name": "checkControllerAccess",
        "outputs": [
            {"internalType": "bool", "name": "", "type": "bool"}
        ],
        "stateMutability": "view",
        "type": "function"
    }
] 