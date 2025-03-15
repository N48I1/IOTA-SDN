pragma solidity >=0.8.2 <0.9.0;

contract Authority{
 
    address private owner;
    address[] private revoked;

    mapping (address => Certificate) private certs;
 
    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }
      constructor() public {
        owner = msg.sender;
    }

     struct Certificate {
        address identity;
        bytes32 publicKey;
        uint expiry;
        bool revoked;
        bool registered;
    }
        
        event Certified(address from, address to, uint date);
   // Add a trusted entity. Owner of the PKI only
    function RegisterCert(address ISPs, bytes32 publicKey, uint expiry) public onlyOwner {
        require(ISPs != address(0x0));
 
        certs[ISPs].identity = ISPs;
        certs[ISPs].publicKey = publicKey;
        certs[ISPs].expiry = expiry;
        certs[ISPs].revoked = false;
        certs[ISPs].registered = true;
 
        emit Certified(owner, ISPs, block.timestamp);
    }

        event Revoked(address from, address to, uint date);
 
    function revoke(address ISPs) public onlyOwner {
        require(ISPs != address(0x0) && certs[ISPs].registered);
 
        certs[ISPs].revoked = true;
        revoked.push(ISPs);
 
        emit Revoked(owner, ISPs, block.timestamp);
    }
 
    function isCertificateValid(address ISPs) public view returns(bool) {
        require(ISPs != address(0x0) && certs[ISPs].registered);
 
        if (certs[ISPs].revoked || certs[ISPs].expiry < block.timestamp) // 
            return false;
        return true;
    }
 
    function cert_revo_list() external view returns(address[] memory) {
        return revoked;
    }

}
