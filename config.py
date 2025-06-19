BLOCKCHAIN_CONFIG = {
    'providerUrl': 'https://json-rpc.evm.testnet.iotaledger.net/',
    'controller1': '0x94F6D50D4a103046F2ad1Dc05278c0b96Cb83bFF',
    'controller2': '0xC95449F9a0eDf900E7a91B43eA982aF6cE7C411B',
    'switch1': '0x4997332d52e039073956cf5AEC4Ca960550cba85',
    'switch2': '0x0C64Db372B0aBA5a65251f6E2CcB62B499b60975',
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