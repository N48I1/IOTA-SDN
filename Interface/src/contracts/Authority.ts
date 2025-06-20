export const AuthorityABI = [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "date",
				"type": "uint256"
			}
		],
		"name": "Certified",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "date",
				"type": "uint256"
			}
		],
		"name": "Revoked",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "ISPs",
				"type": "address"
			},
			{
				"internalType": "bytes32",
				"name": "publicKey",
				"type": "bytes32"
			},
			{
				"internalType": "uint256",
				"name": "expiry",
				"type": "uint256"
			}
		],
		"name": "RegisterCert",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "cert_revo_list",
		"outputs": [
			{
				"internalType": "address[]",
				"name": "",
				"type": "address[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "ISPs",
				"type": "address"
			}
		],
		"name": "isCertificateValid",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "ISPs",
				"type": "address"
			}
		],
		"name": "revoke",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
];

// src/contracts/AccessControl.ts
export const AccessControlABI = [
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "autho",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "ISPs",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "controllerAddress",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "switchAddress",
				"type": "address"
			}
		],
		"name": "AccessGranted",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "controllerAddress",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "switchAddress",
				"type": "address"
			}
		],
		"name": "AccessRevoked",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_controllerAddress",
				"type": "address"
			}
		],
		"name": "addController",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_controllerAddress",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "_standbyController",
				"type": "address"
			}
		],
		"name": "addStandbyController",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_switchAddress",
				"type": "address"
			}
		],
		"name": "addSwitch",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "fromController",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "toController",
				"type": "address"
			}
		],
		"name": "ControllerAccessGranted",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "fromController",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "toController",
				"type": "address"
			}
		],
		"name": "ControllerAccessRevoked",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "controllerAddress",
				"type": "address"
			}
		],
		"name": "ControllerAdded",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_controllerAddress",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "_switchAddress",
				"type": "address"
			}
		],
		"name": "grantAccess",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_fromController",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "_toController",
				"type": "address"
			}
		],
		"name": "grantControllerAccess",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_controllerAddress",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "_standbyController",
				"type": "address"
			}
		],
		"name": "removeStandbyController",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_controllerAddress",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "_switchAddress",
				"type": "address"
			}
		],
		"name": "revokeAccess",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_fromController",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "_toController",
				"type": "address"
			}
		],
		"name": "revokeControllerAccess",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "controllerAddress",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "standbyController",
				"type": "address"
			}
		],
		"name": "StandbyControllerAdded",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "switchAddress",
				"type": "address"
			}
		],
		"name": "SwitchAdded",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "accessControl",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_controllerAddress",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "_switchAddress",
				"type": "address"
			}
		],
		"name": "checkAccess",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "controllers",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "standbyControllers",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "switches",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];
