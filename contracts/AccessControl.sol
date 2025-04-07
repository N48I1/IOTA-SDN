
pragma solidity >=0.8.2 <0.9.0;
import "./Authority.sol";
contract AccessControl {
	
	address private owner;    // owner == ISPs  
    Authority private Autho; // instance of Sc autority 
    mapping(address => bool) public controllers;
    mapping(address => bool) public switches;
    mapping(address => mapping(address => bool)) public accessControl;
    mapping(address => mapping(address => bool)) public standbyControllers;

    event ControllerAdded(address indexed controllerAddress);
    event SwitchAdded(address indexed switchAddress);
    event AccessGranted(address indexed controllerAddress, address indexed switchAddress);
    event AccessRevoked(address indexed controllerAddress, address indexed switchAddress);
    event StandbyControllerAdded(address indexed controllerAddress, address indexed standbyController);
    event ControllerAccessGranted(address indexed fromController, address indexed toController);
    event ControllerAccessRevoked(address indexed fromController, address indexed toController);

	constructor(address autho, address ISPs) public{
    require(ISPs != address(0x0) && autho != address(0x0));
 
        Autho = Authority(autho);
        owner = ISPs;
    }

	 modifier onlyOwner  {       
        require(msg.sender == owner, "Only the owner can perform this action");
        require(Autho.isCertificateValid(owner));
        _;
    }

    function addController(address _controllerAddress) external onlyOwner {
        controllers[_controllerAddress] = true;
        emit ControllerAdded(_controllerAddress);
    }

    function addSwitch(address _switchAddress) external onlyOwner {
        switches[_switchAddress] = true;
        emit SwitchAdded(_switchAddress);
    }

    function grantAccess(address _controllerAddress, address _switchAddress) external onlyOwner {
        accessControl[_controllerAddress][_switchAddress] = true;
        emit AccessGranted(_controllerAddress, _switchAddress);
    }

    function revokeAccess(address _controllerAddress, address _switchAddress) external onlyOwner {
        accessControl[_controllerAddress][_switchAddress] = false;
        emit AccessRevoked(_controllerAddress, _switchAddress);
    }

    function addStandbyController(address _controllerAddress, address _standbyController) external onlyOwner {
        standbyControllers[_controllerAddress][_standbyController] = true;
        emit StandbyControllerAdded(_controllerAddress, _standbyController);
    }

    function removeStandbyController(address _controllerAddress, address _standbyController) external onlyOwner {
        standbyControllers[_controllerAddress][_standbyController] = false;
    }

    function grantControllerAccess(address _fromController, address _toController) external onlyOwner {
        accessControl[_fromController][_toController] = true;
        emit ControllerAccessGranted(_fromController, _toController);
    }

    function revokeControllerAccess(address _fromController, address _toController) external onlyOwner {
        accessControl[_fromController][_toController] = false;
        emit ControllerAccessRevoked(_fromController, _toController);
    }

    function checkAccess(address _controllerAddress, address _switchAddress) external view returns (bool) {
        return accessControl[_controllerAddress][_switchAddress];
    }
}
