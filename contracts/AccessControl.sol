// SPDX-License-Identifier: MIT
pragma solidity >=0.8.2 <0.9.0;

import "./Authority.sol";

contract AccessControl {
    address private owner;       // owner == ISPs  
    Authority private Autho;     // instance of SC Authority

    mapping(address => bool) public controllers;
    mapping(address => bool) public switches;
    mapping(address => mapping(address => bool)) public accessControl;
    mapping(address => mapping(address => bool)) public standbyControllers;
    address[] private allControllers;
    address[] private allSwitches;

    event ControllerAdded(address indexed controllerAddress);
    event SwitchAdded(address indexed switchAddress);
    event AccessGranted(address indexed controllerAddress, address indexed switchAddress);
    event AccessRevoked(address indexed controllerAddress, address indexed switchAddress);
    event StandbyControllerAdded(address indexed controllerAddress, address indexed standbyController);
    event ControllerAccessGranted(address indexed fromController, address indexed toController);
    event ControllerAccessRevoked(address indexed fromController, address indexed toController);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(address autho, address ISPs) {
        require(ISPs != address(0x0) && autho != address(0x0), "Zero address not allowed");
        Autho = Authority(autho);
        owner = ISPs;
    }

    modifier onlyOwner {
        require(msg.sender == owner, "Only the owner can perform this action");
        require(Autho.isCertificateValid(owner), "Owner certificate is not valid");
        _;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        require(Autho.isCertificateValid(newOwner), "New owner must have a valid certificate");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function addController(address _controllerAddress) external onlyOwner {
        require(!controllers[_controllerAddress], "Controller already exists");
        controllers[_controllerAddress] = true;
        allControllers.push(_controllerAddress);
        emit ControllerAdded(_controllerAddress);
    }

    function addSwitch(address _switchAddress) external onlyOwner {
        require(!switches[_switchAddress], "Switch already exists");
        switches[_switchAddress] = true;
        allSwitches.push(_switchAddress);
        emit SwitchAdded(_switchAddress);
    }

    function grantAccess(address _controllerAddress, address _switchAddress) external onlyOwner {
        require(controllers[_controllerAddress], "Invalid controller");
        require(switches[_switchAddress], "Invalid switch");
        accessControl[_controllerAddress][_switchAddress] = true;
        emit AccessGranted(_controllerAddress, _switchAddress);
    }

    function revokeAccess(address _controllerAddress, address _switchAddress) external onlyOwner {
        require(controllers[_controllerAddress], "Invalid controller");
        require(switches[_switchAddress], "Invalid switch");
        accessControl[_controllerAddress][_switchAddress] = false;
        emit AccessRevoked(_controllerAddress, _switchAddress);
    }

    function addStandbyController(address _controllerAddress, address _standbyController) external onlyOwner {
        require(controllers[_controllerAddress], "Invalid main controller");
        require(controllers[_standbyController], "Invalid standby controller");
        standbyControllers[_controllerAddress][_standbyController] = true;
        emit StandbyControllerAdded(_controllerAddress, _standbyController);
    }

    function removeStandbyController(address _controllerAddress, address _standbyController) external onlyOwner {
        standbyControllers[_controllerAddress][_standbyController] = false;
    }

    function grantControllerAccess(address _fromController, address _toController) external onlyOwner {
        require(controllers[_fromController], "Invalid fromController");
        require(controllers[_toController], "Invalid toController");
        accessControl[_fromController][_toController] = true;
        emit ControllerAccessGranted(_fromController, _toController);
    }

    function revokeControllerAccess(address _fromController, address _toController) external onlyOwner {
        require(controllers[_fromController], "Invalid fromController");
        require(controllers[_toController], "Invalid toController");
        accessControl[_fromController][_toController] = false;
        emit ControllerAccessRevoked(_fromController, _toController);
    }

    function checkAccess(address _controllerAddress, address _switchAddress) external view returns (bool) {
        return accessControl[_controllerAddress][_switchAddress];
    }

    function isValid() public view returns (bool) {
        for (uint i = 0; i < allControllers.length; i++) {
            for (uint j = 0; j < allSwitches.length; j++) {
                if (accessControl[allControllers[i]][allSwitches[j]]) {
                    return true;
                }
            }
        }
        return false;
    }

    event SwitchAccessGranted(address indexed switch1, address indexed switch2);

   function grantSwitchAccess(address switch1, address switch2) external onlyOwner {
       require(switches[switch1], "Invalid switch1");
       require(switches[switch2], "Invalid switch2");
       accessControl[switch1][switch2] = true;
       accessControl[switch2][switch1] = true;
       emit SwitchAccessGranted(switch1, switch2);
   }

    function revokeSwitchAccess(address switch1, address switch2) external onlyOwner {
        require(switches[switch1], "Invalid switch1");
        require(switches[switch2], "Invalid switch2");
        accessControl[switch1][switch2] = false;
        accessControl[switch2][switch1] = false;
    }
}