// SPDX-License-Identifier: MIT
pragma solidity >=0.8.2 <0.9.0;

contract LogManager {
    // -------- State Variables --------
    address private owner;
    bool private paused;
    uint256 private constant MAX_LOGS = 1000;
    uint256 private logCount;
    
    // -------- Structures --------
    struct LogEntry {
        uint256 id;
        address indexed sender;
        string logType;
        string message;
        uint256 timestamp;
        bool isActive;
    }
    
    // -------- Mappings --------
    mapping(uint256 => LogEntry) private logs;
    mapping(address => bool) private authorizedLoggers;
    
    // -------- Events --------
    event AttackDetected(
        address indexed attacker,
        string attackType,
        string details,
        uint256 severity,
        uint256 timestamp
    );
    
    event ControllerSwitched(
        address indexed oldController,
        address indexed newController,
        string reason,
        uint256 timestamp
    );
    
    event AccessChangeLogged(
        address indexed controller,
        address indexed switchDevice,
        bool accessGranted,
        string reason,
        uint256 timestamp
    );
    
    event GeneralLog(
        string message,
        string category,
        uint256 severity,
        uint256 timestamp
    );
    
    event LoggerAuthorized(address indexed logger, bool authorized);
    event ContractPaused(bool paused);
    event LogRotated(uint256 oldCount, uint256 newCount);
    
    // -------- Modifiers --------
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }
    
    modifier onlyAuthorized() {
        require(authorizedLoggers[msg.sender] || msg.sender == owner, "Not authorized");
        _;
    }
    
    // -------- Constructor --------
    constructor(address _owner) {
        require(_owner != address(0), "Owner address cannot be zero");
        owner = _owner;
        authorizedLoggers[_owner] = true;
        paused = false;
        logCount = 0;
    }
    
    // -------- Core Functions --------
    function logAttackDetected(
        address attacker,
        string calldata attackType,
        string calldata details,
        uint256 severity
    ) external onlyAuthorized whenNotPaused {
        require(severity <= 10, "Severity must be between 0 and 10");
        _addLog(attacker, "ATTACK", attackType);
        emit AttackDetected(attacker, attackType, details, severity, block.timestamp);
    }

    function logControllerSwitch(
        address oldController,
        address newController,
        string calldata reason
    ) external onlyAuthorized whenNotPaused {
        require(newController != address(0), "New controller cannot be zero address");
        _addLog(msg.sender, "CONTROLLER_SWITCH", reason);
        emit ControllerSwitched(oldController, newController, reason, block.timestamp);
    }

    function logAccessChange(
        address controller,
        address switchDevice,
        bool accessGranted,
        string calldata reason
    ) external onlyAuthorized whenNotPaused {
        require(switchDevice != address(0), "Switch device cannot be zero address");
        _addLog(msg.sender, "ACCESS_CHANGE", reason);
        emit AccessChangeLogged(controller, switchDevice, accessGranted, reason, block.timestamp);
    }

    function logGeneral(
        string calldata message,
        string calldata category,
        uint256 severity
    ) external onlyAuthorized whenNotPaused {
        require(severity <= 10, "Severity must be between 0 and 10");
        _addLog(msg.sender, category, message);
        emit GeneralLog(message, category, severity, block.timestamp);
    }

    // -------- Management Functions --------
    function changeOwner(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        address oldOwner = owner;
        owner = newOwner;
        authorizedLoggers[oldOwner] = false;
        authorizedLoggers[newOwner] = true;
        _addLog(msg.sender, "OWNER_CHANGE", "Owner changed");
    }
    
    function authorizeLogger(address logger, bool authorized) external onlyOwner {
        authorizedLoggers[logger] = authorized;
        emit LoggerAuthorized(logger, authorized);
        _addLog(msg.sender, "AUTHORIZATION", authorized ? "Logger authorized" : "Logger unauthorized");
    }
    
    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit ContractPaused(_paused);
        _addLog(msg.sender, "PAUSE", _paused ? "Contract paused" : "Contract unpaused");
    }
    
    function rotateLogs() external onlyOwner {
        uint256 oldCount = logCount;
        logCount = 0;
        emit LogRotated(oldCount, logCount);
        _addLog(msg.sender, "ROTATION", "Logs rotated");
    }
    
    // -------- View Functions --------
    function getOwner() external view returns (address) {
        return owner;
    }
    
    function isPaused() external view returns (bool) {
        return paused;
    }
    
    function isAuthorized(address logger) external view returns (bool) {
        return authorizedLoggers[logger];
    }
    
    function getLog(uint256 logId) external view returns (LogEntry memory) {
        require(logId < logCount, "Log does not exist");
        return logs[logId];
    }
    
    function getLogCount() external view returns (uint256) {
        return logCount;
    }
    
    // -------- Internal Functions --------
    function _addLog(
        address sender,
        string memory logType,
        string memory message
    ) internal {
        if (logCount >= MAX_LOGS) {
            // If we reach max logs, start overwriting from the beginning
            logCount = 0;
        }
        
        logs[logCount] = LogEntry({
            id: logCount,
            sender: sender,
            logType: logType,
            message: message,
            timestamp: block.timestamp,
            isActive: true
        });
        
        logCount++;
    }
}
