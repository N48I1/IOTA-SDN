// SPDX-License-Identifier: MIT
pragma solidity >=0.8.2 <0.9.0;

contract Authority {
    address private owner;
    address[] private revoked;
    mapping(address => Certificate) private certs;

    modifier onlyOwner {
        require(msg.sender == owner, "Seul le proprietaire peut effectuer cette operation");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    struct Certificate {
        bytes32 publicKey;
        uint expiry;
        bool revoked;
        bool registered;
    }
    
    event Certified(address from, address to, uint date);
    
    function RegisterCert(address ISPs, bytes32 publicKey, uint expiry) public onlyOwner {
        require(ISPs != address(0), "Adresse invalide");
        require(!certs[ISPs].registered, "Certificat deja enregistre");

        certs[ISPs] = Certificate({
            publicKey: publicKey,
            expiry: expiry,
            revoked: false,
            registered: true
        });

        emit Certified(owner, ISPs, block.timestamp);
    }

    event Revoked(address from, address to, uint date);
    
    function revoke(address ISPs) public onlyOwner {
        require(ISPs != address(0), "Adresse invalide");
        require(certs[ISPs].registered, "Certificat non enregistre");
        require(!certs[ISPs].revoked, "Certificat deja revoke");

        certs[ISPs].revoked = true;
        revoked.push(ISPs);

        emit Revoked(owner, ISPs, block.timestamp);
    }
    
    function isCertificateValid(address ISPs) public view returns (bool) {
        require(ISPs != address(0), "Adresse invalide");
        require(certs[ISPs].registered, "Certificat non enregistre");

        return (!certs[ISPs].revoked && certs[ISPs].expiry >= block.timestamp);
    }
    
    function cert_revo_list() external view returns (address[] memory) {
        return revoked;
    }
}
