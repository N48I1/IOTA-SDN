
# add controller 1          :   0x7F53d082A31c065493A119800AE9B680a752b5F9 by IPS 
# add Switch 1              :   0x1E9eb2b168993C1c4e79a4B1A7082a1BDA1D3234 by IPS 
# add switch 2              :   0x1E9eb2b168993C1c4e79a4B1A7082a1BDA1D3234 by IPS 
# add switch 3              :   0x5eE1BEdd2E19DebFdD62eA57BDD1AcF8bf36C58A by IPS 
# add addStandbyController  :   0x52f68B8c1c11DF43eDF0b47ba20952FF5d299218 by IPS ##not used
# add controller 2          :   0x52f68B8c1c11DF43eDF0b47ba20952FF5d299218 by IPS 

# Access Contorll           :   0xC184836543aBd0B70ffb2A8083eEf57F829ACD62

# valid  certificate        :   0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
# revoke certificate        :   0x45191aa30986B3207C42102787f14f896AFB5554


from topology1 import topology_1
#from topology2 import topology_2
import json
from web3 import Web3
from mininet.topo import Topo
from mininet.net import Mininet
from mininet.node import Controller, OVSKernelSwitch, UserSwitch, DefaultController
from mininet.cli import CLI
from mininet.log import setLogLevel, info
from mininet.link import Link, TCLink

def check_certificate_validity():
    my_address = "0xC184836543aBd0B70ffb2A8083eEf57F829ACD62"    
    private_key = "7354d112f673e3dbc329479d91b8e97a6b77a327389dd946227a15360a67ccb6"
    print("Connexion to iota.network  : ",web3.is_connected())

    with open('abi/authority.json') as f:
        abi = json.load(f)   

    address = "0x8859CEA6f5F0DF05252D132F2f0bae5fF73Ed90F"
    contract = web3.eth.contract(address=address, abi=abi)
    x = contract.functions.isCertificateValid(my_address).call()
    return x

def check_access_Controller_to_switch():
    # Connect to your blockchain network
    my_addresse = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    private_key = "7354d112f673e3dbc329479d91b8e97a6b77a327389dd946227a15360a67ccb6"
    print("Connection to iota.network:", web3.is_connected())
    
    with open('abi/AccessControl.json') as f:
        abi = json.load(f)

    address = "0x217f3c3C1859Ae5CF316679Ac3831ECAD97eee08"
    contract = web3.eth.contract(address=address, abi=abi)
    
    # Function used by Devices to get access Control between Devices (controller 1 and switch 2):
    x = contract.functions.checkAccess('0x7F53d082A31c065493A119800AE9B680a752b5F9', '0x1E9eb2b168993C1c4e79a4B1A7082a1BDA1D3234').call()
    
    print("Get access status between Controller C0 and Switch S1 : ", x)
    return x  

def check_access_Switch_to_switch():
    # Connect to your blockchain network
    my_addresse = "0xac7c33305CaAB6e53955876374B97ED6203AD1D7"
    private_key = "7354d112f673e3dbc329479d91b8e97a6b77a327389dd946227a15360a67ccb6"
    print("Connection to iota.network:", web3.is_connected())
    
    with open('abi/AccessControl.json') as f:
        abi = json.load(f)
    
    address = "0x217f3c3C1859Ae5CF316679Ac3831ECAD97eee08"
    contract = web3.eth.contract(address=address, abi=abi)
    
    # Function used by Devices to get access Control betwen Devices (switch 1 and switch 2):
    z = contract.functions.checkAccess('0x1E9eb2b168993C1c4e79a4B1A7082a1BDA1D3234','0xac7c33305CaAB6e53955876374B97ED6203AD1D7').call()    

    print("Get access status between switch1 and switch2  : ",z) 
    return z

def check_access_Controller_to_contoller():
            # Connect to your blockchain network
    my_addresse = "0xac7c33305CaAB6e53955876374B97ED6203AD1D7"
    private_key = "7354d112f673e3dbc329479d91b8e97a6b77a327389dd946227a15360a67ccb6"
    print("Connection to iota.network:", web3.is_connected())
    
    with open('abi/AccessControl.json') as f:
        abi = json.load(f)
    
    address = "0x217f3c3C1859Ae5CF316679Ac3831ECAD97eee08"
    contract = web3.eth.contract(address=address, abi=abi)
    
    #Function used by Devices to get access Control betwen Devices (controller 1 and Controller 2):
    y = contract.functions.checkAccess('0x7F53d082A31c065493A119800AE9B680a752b5F9','0x52f68B8c1c11DF43eDF0b47ba20952FF5d299218').call()
    
    print("Get access status between controller1 and Controller2  : ",y)
    return y

def start_mininet_cli(net, certificate_valid, access_control_CS, access_control_SS, access_control_CC):
    if certificate_valid:
        print("Certificate is valid.")
    else:
        print("Certificate is not valid. Exiting.")
        return

    if access_control_CS:
        print("Access between controller C0 and switch s1 is valid.")
    else:
        print("Access between controller C0 and switch s1 is not valid. Exiting.")
        return
    if access_control_SS:
        print("Access between switch s1 and switch s2 is valid.")
    else:
        print("Access between switch s1 and switch s2 is not valid. Exiting.")
        return    

    if not access_control_CC:
        print("Access between controller C0 and controller C1 is not valid. Exiting.")
        return

    print("Starting CLI...")
    

    try:
        while True:
            # Ping between switches or controllers
            if net.pingAll() == 0:
                print("Ping successful. Continuing...")
                break
            else:
                print("Ping failed. Stopping network.")
                break

    except KeyboardInterrupt:
        print("\n*** Stopping network")
        net.stop()


if __name__ == '__main__':

    web3 = Web3(Web3.HTTPProvider("https://json-rpc.evm.testnet.iotaledger.net/"))
    chain_id = 1073
    print("Connexion to iota.network  : ",web3.is_connected())

    setLogLevel('info')
    
    # For topology 1
    net1 = topology_1()
    certificate_valid = check_certificate_validity()
    access_control_CS = check_access_Controller_to_switch()
    access_control_SS = check_access_Switch_to_switch()
    access_control_CC = check_access_Controller_to_contoller()
    start_mininet_cli(net1, certificate_valid, access_control_CS, access_control_SS, access_control_CC)