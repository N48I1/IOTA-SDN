// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "./LogManager.sol";

contract SecurityMonitor {
    LogManager private logManager;
    address private owner;

    struct DeviceInfo {
        uint256 lastTimestamp;
        uint256 requestCount;
        uint256 cooldownEnd;
        uint256 lastNonce;
        bool blocked;
    }

    mapping(address => DeviceInfo) public devices;
    mapping(address => bool) public allowedDevices; // Authorized device list
    mapping(address => uint256) public securityScore; // Track security reputation

    uint256 constant public maxRequests = 10;
    uint256 constant public cooldownPeriod = 1 minutes;
    uint256 constant public blockDuration = 30 minutes;

    event SuspiciousActivity(address indexed device, string reason, uint256 timestamp);
    event ActionPerformed(address indexed device, uint256 timestamp);
    event UnauthorizedAccessAttempt(address indexed device);
    event DeviceBlocked(address indexed device, uint256 timestamp, uint256 duration);
    event DeviceUnblocked(address indexed device, uint256 timestamp);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    modifier onlyAuthorizedDevice(address _device) {
        require(allowedDevices[_device], "Unauthorized device");
        require(!devices[_device].blocked, "Device is blocked");
        _;
    }

    constructor(address _logManager) {
        owner = msg.sender;
        // Setup LogManager for event logging
        logManager = LogManager(_logManager);
        // For testing: allow deployer as a device
        allowedDevices[msg.sender] = true;
        securityScore[msg.sender] = 100; // Max score
    }

    function authorizeDevice(address _device) external onlyOwner {
        allowedDevices[_device] = true;
        securityScore[_device] = 80; // Initial score for new devices
        logManager.logAccessChange(msg.sender, _device, true);
    }

    function revokeDevice(address _device) external onlyOwner {
        allowedDevices[_device] = false;
        logManager.logAccessChange(msg.sender, _device, false);
    }

    function performAction(address _device, uint256 _nonce) external onlyAuthorizedDevice(_device) returns (bool) {
        // Security checks
        if (!checkReplay(_device, _nonce)) {
            return false;
        }
        
        if (!checkDoSProtection(_device)) {
            return false;
        }

        // ✅ Action can be executed safely here
        emit ActionPerformed(_device, block.timestamp);
        logManager.logGeneral(string(abi.encodePacked("Action performed by device: ", _addressToString(_device))));

        // Update device state
        devices[_device].requestCount++;
        devices[_device].lastTimestamp = block.timestamp;
        devices[_device].lastNonce = _nonce;
        
        // Reward successful action
        if (securityScore[_device] < 100) {
            securityScore[_device]++;
        }
        
        return true;
    }

    function checkDoSProtection(address _device) internal returns (bool) {
        DeviceInfo storage dev = devices[_device];

        // If device was in cooldown and cooldown is over
        if (dev.cooldownEnd > 0 && block.timestamp >= dev.cooldownEnd) {
            dev.cooldownEnd = 0;
            dev.requestCount = 0;
        }

        // If still in cooldown period, reject
        if (dev.cooldownEnd > block.timestamp) {
            return false;
        }

        // If past rate limit
        if (dev.requestCount >= maxRequests) {
            // Set cooldown based on security score (lower score = longer cooldown)
            uint256 multiplier = (100 - (securityScore[_device] < 20 ? 20 : securityScore[_device])) / 10;
            dev.cooldownEnd = block.timestamp + (cooldownPeriod * (1 + multiplier));
            
            emit SuspiciousActivity(_device, "DoS attempt detected", block.timestamp);
            logManager.logAttackDetected(_device, "DoS");
            
            // Reduce security score for potential DoS
            if (securityScore[_device] > 5) {
                securityScore[_device] -= 5;
            }
            
            return false;
        }

        return true;
    }

    function checkReplay(address _device, uint256 _nonce) internal returns (bool) {
        if (_nonce <= devices[_device].lastNonce) {
            emit SuspiciousActivity(_device, "Replay attack attempt", block.timestamp);
            logManager.logAttackDetected(_device, "Replay");
            
            // Severely punish replay attacks
            if (securityScore[_device] > 20) {
                securityScore[_device] -= 20;
            } else {
                // Block device with too many replay attempts
                blockDevice(_device);
            }
            
            return false;
        }
        return true;
    }
    
    function blockDevice(address _device) internal {
        devices[_device].blocked = true;
        emit DeviceBlocked(_device, block.timestamp, blockDuration);
        logManager.logAccessChange(owner, _device, false);
        
        // Schedule automatic unblocking after blockDuration
        // Note: In a real implementation this would require an oracle or keeper service
        devices[_device].cooldownEnd = block.timestamp + blockDuration;
    }
    
    function unblockDevice(address _device) external onlyOwner {
        require(devices[_device].blocked, "Device is not blocked");
        devices[_device].blocked = false;
        devices[_device].cooldownEnd = 0;
        devices[_device].requestCount = 0;
        emit DeviceUnblocked(_device, block.timestamp);
        logManager.logAccessChange(owner, _device, true);
    }

    function isDeviceAuthorized(address _device) external view returns (bool) {
        return allowedDevices[_device] && !devices[_device].blocked;
    }

    function getDeviceInfo(address _device) external view returns (
        uint256 lastTimestamp,
        uint256 requestCount,
        uint256 cooldownEnd,
        uint256 lastNonce,
        bool blocked,
        uint256 score
    ) {
        DeviceInfo memory info = devices[_device];
        return (
            info.lastTimestamp, 
            info.requestCount, 
            info.cooldownEnd, 
            info.lastNonce, 
            info.blocked,
            securityScore[_device]
        );
    }
    
    function getSecurityScore(address _device) external view returns (uint256) {
        return securityScore[_device];
    }
    
    function setLogManager(address _logManager) external onlyOwner {
        logManager = LogManager(_logManager);
    }
    
    // Helper function to convert address to string
    function _addressToString(address _addr) internal pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(_addr)));
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42);
        str[0] = '0';
        str[1] = 'x';
        
        for (uint256 i = 0; i < 20; i++) {
            str[2+i*2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3+i*2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        
        return string(str);
    }
}