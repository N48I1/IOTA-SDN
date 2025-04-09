from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.backends import default_backend
from web3 import Web3
import json

def generate_key_pair():
    # Generate private key
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
        backend=default_backend()
    )
    
    # Get public key
    public_key = private_key.public_key()
    
    # Serialize private key to PEM format
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    
    # Serialize public key to PEM format
    public_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    
    # Convert public key to bytes32 format (using keccak256 hash)
    w3 = Web3()
    public_key_hash = w3.keccak(public_pem).hex()
    
    return {
        'private_key': private_pem.decode('utf-8'),
        'public_key': public_pem.decode('utf-8'),
        'public_key_hash': public_key_hash
    }

if __name__ == "__main__":
    # Generate a key pair
    keys = generate_key_pair()
    
    # Save to file
    with open('isp_keys.json', 'w') as f:
        json.dump(keys, f, indent=4)
    
    print("Keys generated and saved to isp_keys.json")
    print("\nPublic Key Hash (for smart contract):")
    print(keys['public_key_hash'])
    print("\nPrivate Key (keep this secure!):")
    print(keys['private_key'])
    print("\nPublic Key:")
    print(keys['public_key']) 