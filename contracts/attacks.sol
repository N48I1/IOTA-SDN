// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract SecurityMonitor {

    struct DeviceInfo {
        uint256 lastTimestamp;
        uint256 requestCount;
        uint256 lastNonce;
    }

    mapping(address => DeviceInfo) public devices;
    mapping(address => bool) public allowedDevices; // Authorized device list

    uint256 constant public maxRequests = 10;
    uint256 constant public cooldownPeriod = 1 minutes;

    event SuspiciousActivity(address indexed device, string reason, uint256 timestamp);
    event ActionPerformed(address indexed device, uint256 timestamp);
    event UnauthorizedAccessAttempt(address indexed device);

    modifier onlyAuthorizedDevice(address _device) {
        require(allowedDevices[_device], "Unauthorized device");
        _;
    }

    constructor() {
        // For testing: allow deployer as a device
        allowedDevices[msg.sender] = true;
    }

    function authorizeDevice(address _device) external {
        // In production: restrict this to owner or admin
        allowedDevices[_device] = true;
    }

    function revokeDevice(address _device) external {
        // In production: restrict this to owner or admin
        allowedDevices[_device] = false;
    }

    function performAction(address _device, uint256 _nonce) external onlyAuthorizedDevice(_device) {
        require(checkReplay(_device, _nonce), "Replay attack detected");
        require(checkDoSProtection(_device), "DoS protection: Too many requests");

        // ✅ Action can be executed safely here
        emit ActionPerformed(_device, block.timestamp);

        devices[_device].requestCount++;
        devices[_device].lastTimestamp = block.timestamp;
        devices[_device].lastNonce = _nonce;
    }

    function checkDoSProtection(address _device) internal returns (bool) {
        DeviceInfo storage dev = devices[_device];

        // If cooldown passed, reset counter
        if (block.timestamp - dev.lastTimestamp >= cooldownPeriod) {
            dev.requestCount = 0;
        }

        if (dev.requestCount >= maxRequests) {
            emit SuspiciousActivity(_device, "DoS attempt detected", block.timestamp);
            return false;
        }

        return true;
    }

    function checkReplay(address _device, uint256 _nonce) internal returns (bool) {
        if (_nonce <= devices[_device].lastNonce) {
            emit SuspiciousActivity(_device, "Replay attack attempt", block.timestamp);
            return false;
        }
        return true;
    }

    function isDeviceAuthorized(address _device) external view returns (bool) {
        return allowedDevices[_device];
    }

    function getDeviceInfo(address _device) external view returns (
        uint256 lastTimestamp,
        uint256 requestCount,
        uint256 lastNonce
    ) {
        DeviceInfo memory info = devices[_device];
        return (info.lastTimestamp, info.requestCount, info.lastNonce);
    }
}
