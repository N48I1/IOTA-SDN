
# add controller 1          :   0x7F53d082A31c065493A119800AE9B680a752b5F9 by IPS 
# add Switch 1              :   0x1E9eb2b168993C1c4e79a4B1A7082a1BDA1D3234 by IPS 
# add switch 2              :   0xac7c33305CaAB6e53955876374B97ED6203AD1D7 by IPS 
# add switch 3              :   0x5eE1BEdd2E19DebFdD62eA57BDD1AcF8bf36C58A by IPS 
# add addStandbyController  :   0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC by IPS ##not used
# add controller 2          :   0x52f68B8c1c11DF43eDF0b47ba20952FF5d299218 by IPS 


import json
from web3 import Web3
from mininet.topo import Topo
from mininet.net import Mininet
from mininet.node import Controller, OVSKernelSwitch, UserSwitch, DefaultController
from mininet.cli import CLI
from mininet.log import setLogLevel, info
from mininet.link import Link, TCLink

web3 = Web3(Web3.HTTPProvider("https://json-rpc.evm.testnet.iotaledger.net/"))
chain_id = 1075
def check_certificate_validity():
    # Add your web3 and smart contract interaction code here
    # Example: Check if the certificate for 'my_address' is valid

    my_address = "0xAdb5864087a93C0eA62f49ea3Ab747653e0387ea"
    private_key = "7354d112f673e3dbc329479d91b8e97a6b77a327389dd946227a15360a67ccb6"
    print("Connexion to iota.network  : ",web3.is_connected())
    abi = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":False,"inputs":[{"indexed":False,"internalType":"address","name":"from","type":"address"},{"indexed":False,"internalType":"address","name":"to","type":"address"},{"indexed":False,"internalType":"uint256","name":"date","type":"uint256"}],"name":"Certified","type":"event"},{"anonymous":False,"inputs":[{"indexed":False,"internalType":"address","name":"from","type":"address"},{"indexed":False,"internalType":"address","name":"to","type":"address"},{"indexed":False,"internalType":"uint256","name":"date","type":"uint256"}],"name":"Revoked","type":"event"},{"inputs":[{"internalType":"address","name":"ISPs","type":"address"},{"internalType":"bytes32","name":"publicKey","type":"bytes32"},{"internalType":"uint256","name":"expiry","type":"uint256"}],"name":"RegisterCert","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"cert_revo_list","outputs":[{"internalType":"address[]","name":"","type":"address[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"ISPs","type":"address"}],"name":"isCertificateValid","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"ISPs","type":"address"}],"name":"revoke","outputs":[],"stateMutability":"nonpayable","type":"function"}]
    address = "0xab250BaaC49473AC0B07A26Fc8D5A2D345491b91"
    contract = web3.eth.contract(address=address, abi=abi)
    
    # Use the appropriate contract address for each topology
    #if topology_1():
    #   contract_address = "0x0314121674134A7463c17343406ad44951424C09"
    #elif topology_2():
    #  contract_address = "0x1234567890abcdef1234567890abcdef12345678"
    
    x = contract.functions.isCertificateValid(my_address).call()
    return x
       
def check_access_Controller_to_switch():
    # Connect to your blockchain network
    my_addresse = "0xac7c33305CaAB6e53955876374B97ED6203AD1D7"
    private_key = "7354d112f673e3dbc329479d91b8e97a6b77a327389dd946227a15360a67ccb6"
    print("Connection to iota.network:", web3.is_connected())
    
    abi = [{"inputs":[{"internalType":"address","name":"autho","type":"address"},{"internalType":"address","name":"ISPs","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":False,"inputs":[{"indexed":True,"internalType":"address","name":"controllerAddress","type":"address"},{"indexed":True,"internalType":"address","name":"switchAddress","type":"address"}],"name":"AccessGranted","type":"event"},{"anonymous":False,"inputs":[{"indexed":True,"internalType":"address","name":"controllerAddress","type":"address"},{"indexed":True,"internalType":"address","name":"switchAddress","type":"address"}],"name":"AccessRevoked","type":"event"},{"inputs":[{"internalType":"address","name":"_controllerAddress","type":"address"}],"name":"addController","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_controllerAddress","type":"address"},{"internalType":"address","name":"_standbyController","type":"address"}],"name":"addStandbyController","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_switchAddress","type":"address"}],"name":"addSwitch","outputs":[],"stateMutability":"nonpayable","type":"function"},{"anonymous":False,"inputs":[{"indexed":True,"internalType":"address","name":"fromController","type":"address"},{"indexed":True,"internalType":"address","name":"toController","type":"address"}],"name":"ControllerAccessGranted","type":"event"},{"anonymous":False,"inputs":[{"indexed":True,"internalType":"address","name":"fromController","type":"address"},{"indexed":True,"internalType":"address","name":"toController","type":"address"}],"name":"ControllerAccessRevoked","type":"event"},{"anonymous":False,"inputs":[{"indexed":True,"internalType":"address","name":"controllerAddress","type":"address"}],"name":"ControllerAdded","type":"event"},{"inputs":[{"internalType":"address","name":"_controllerAddress","type":"address"},{"internalType":"address","name":"_switchAddress","type":"address"}],"name":"grantAccess","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_switchAddress1","type":"address"},{"internalType":"address","name":"_switchAddress2","type":"address"}],"name":"grantAccessSwitch","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_fromController","type":"address"},{"internalType":"address","name":"_toController","type":"address"}],"name":"grantControllerAccess","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_controllerAddress","type":"address"},{"internalType":"address","name":"_standbyController","type":"address"}],"name":"removeStandbyController","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_controllerAddress","type":"address"},{"internalType":"address","name":"_switchAddress","type":"address"}],"name":"revokeAccess","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_fromController","type":"address"},{"internalType":"address","name":"_toController","type":"address"}],"name":"revokeControllerAccess","outputs":[],"stateMutability":"nonpayable","type":"function"},{"anonymous":False,"inputs":[{"indexed":True,"internalType":"address","name":"controllerAddress","type":"address"},{"indexed":True,"internalType":"address","name":"standbyController","type":"address"}],"name":"StandbyControllerAdded","type":"event"},{"anonymous":False,"inputs":[{"indexed":True,"internalType":"address","name":"switchAddress","type":"address"}],"name":"SwitchAdded","type":"event"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"}],"name":"accessControl","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_controllerAddress","type":"address"},{"internalType":"address","name":"_switchAddress","type":"address"}],"name":"checkAccess","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_controllerAddress","type":"address"},{"internalType":"address","name":"_controllerAddress2","type":"address"}],"name":"checkAccessC","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_switchAddress1","type":"address"},{"internalType":"address","name":"_switchAddress2","type":"address"}],"name":"checkAccessSwitch","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"controllers","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"}],"name":"standbyControllers","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"switches","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"}]

    address = "0x0314121674134A7463c17343406ad44951424C09"
    contract = web3.eth.contract(address=address, abi=abi)
    
    # Function used by Devices to get access Control between Devices (controller 1 and switch 2):
    x = contract.functions.checkAccess('0x7F53d082A31c065493A119800AE9B680a752b5F9', '0x1E9eb2b168993C1c4e79a4B1A7082a1BDA1D3234').call()
    
    x_1 = contract.functions.checkAccess('0x7F53d082A31c065493A119800AE9B680a752b5F9','0x5eE1BEdd2E19DebFdD62eA57BDD1AcF8bf36C58A').call()

    #if topology_1(): 
    print("Get access status between Controller C0 and Switch S1 : ", x)
    return x
    #elif topology_2():
    #print("Get access status between Controller1 and Switch3  : ", x_1)
    #return x_1    
    
def check_access_Switch_to_switch():

    # Connect to your blockchain network
    my_addresse = "0xac7c33305CaAB6e53955876374B97ED6203AD1D7"
    private_key = "7354d112f673e3dbc329479d91b8e97a6b77a327389dd946227a15360a67ccb6"
    print("Connection to iota.network:", web3.is_connected())
    
    abi = [{"inputs":[{"internalType":"address","name":"autho","type":"address"},{"internalType":"address","name":"ISPs","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":False,"inputs":[{"indexed":True,"internalType":"address","name":"controllerAddress","type":"address"},{"indexed":True,"internalType":"address","name":"switchAddress","type":"address"}],"name":"AccessGranted","type":"event"},{"anonymous":False,"inputs":[{"indexed":True,"internalType":"address","name":"controllerAddress","type":"address"},{"indexed":True,"internalType":"address","name":"switchAddress","type":"address"}],"name":"AccessRevoked","type":"event"},{"inputs":[{"internalType":"address","name":"_controllerAddress","type":"address"}],"name":"addController","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_controllerAddress","type":"address"},{"internalType":"address","name":"_standbyController","type":"address"}],"name":"addStandbyController","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_switchAddress","type":"address"}],"name":"addSwitch","outputs":[],"stateMutability":"nonpayable","type":"function"},{"anonymous":False,"inputs":[{"indexed":True,"internalType":"address","name":"fromController","type":"address"},{"indexed":True,"internalType":"address","name":"toController","type":"address"}],"name":"ControllerAccessGranted","type":"event"},{"anonymous":False,"inputs":[{"indexed":True,"internalType":"address","name":"fromController","type":"address"},{"indexed":True,"internalType":"address","name":"toController","type":"address"}],"name":"ControllerAccessRevoked","type":"event"},{"anonymous":False,"inputs":[{"indexed":True,"internalType":"address","name":"controllerAddress","type":"address"}],"name":"ControllerAdded","type":"event"},{"inputs":[{"internalType":"address","name":"_controllerAddress","type":"address"},{"internalType":"address","name":"_switchAddress","type":"address"}],"name":"grantAccess","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_switchAddress1","type":"address"},{"internalType":"address","name":"_switchAddress2","type":"address"}],"name":"grantAccessSwitch","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_fromController","type":"address"},{"internalType":"address","name":"_toController","type":"address"}],"name":"grantControllerAccess","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_controllerAddress","type":"address"},{"internalType":"address","name":"_standbyController","type":"address"}],"name":"removeStandbyController","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_controllerAddress","type":"address"},{"internalType":"address","name":"_switchAddress","type":"address"}],"name":"revokeAccess","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_fromController","type":"address"},{"internalType":"address","name":"_toController","type":"address"}],"name":"revokeControllerAccess","outputs":[],"stateMutability":"nonpayable","type":"function"},{"anonymous":False,"inputs":[{"indexed":True,"internalType":"address","name":"controllerAddress","type":"address"},{"indexed":True,"internalType":"address","name":"standbyController","type":"address"}],"name":"StandbyControllerAdded","type":"event"},{"anonymous":False,"inputs":[{"indexed":True,"internalType":"address","name":"switchAddress","type":"address"}],"name":"SwitchAdded","type":"event"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"}],"name":"accessControl","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_controllerAddress","type":"address"},{"internalType":"address","name":"_switchAddress","type":"address"}],"name":"checkAccess","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_controllerAddress","type":"address"},{"internalType":"address","name":"_controllerAddress2","type":"address"}],"name":"checkAccessC","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_switchAddress1","type":"address"},{"internalType":"address","name":"_switchAddress2","type":"address"}],"name":"checkAccessSwitch","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"controllers","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"}],"name":"standbyControllers","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"switches","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"}]
    address = "0x0314121674134A7463c17343406ad44951424C09"
    contract = web3.eth.contract(address=address, abi=abi)
    
    # Function used by Devices to get access Control betwen Devices (switch 1 and switch 2):
    z = contract.functions.checkAccess('0x1E9eb2b168993C1c4e79a4B1A7082a1BDA1D3234','0xE422568F3C95990E5F58BE87B27F0804017b8697').call()
    z_1 = contract.functions.checkAccess('0x1E9eb2b168993C1c4e79a4B1A7082a1BDA1D3234','0x5eE1BEdd2E19DebFdD62eA57BDD1AcF8bf36C58A').call()
    
    #if topology_1(): 
    print("Get access status between switch1 and switch2  : ",z) 
    return z
    #elif topology_2():
        #print("Get access status between switch1 and switch3  : ",z_1)
        #return z_1    
        

	
def check_access_Controller_to_contoller():

            # Connect to your blockchain network
    my_addresse = "0xac7c33305CaAB6e53955876374B97ED6203AD1D7"
    private_key = "7354d112f673e3dbc329479d91b8e97a6b77a327389dd946227a15360a67ccb6"
    print("Connection to iota.network:", web3.is_connected())
    
    abi = [{"inputs":[{"internalType":"address","name":"autho","type":"address"},{"internalType":"address","name":"ISPs","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":False,"inputs":[{"indexed":True,"internalType":"address","name":"controllerAddress","type":"address"},{"indexed":True,"internalType":"address","name":"switchAddress","type":"address"}],"name":"AccessGranted","type":"event"},{"anonymous":False,"inputs":[{"indexed":True,"internalType":"address","name":"controllerAddress","type":"address"},{"indexed":True,"internalType":"address","name":"switchAddress","type":"address"}],"name":"AccessRevoked","type":"event"},{"inputs":[{"internalType":"address","name":"_controllerAddress","type":"address"}],"name":"addController","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_controllerAddress","type":"address"},{"internalType":"address","name":"_standbyController","type":"address"}],"name":"addStandbyController","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_switchAddress","type":"address"}],"name":"addSwitch","outputs":[],"stateMutability":"nonpayable","type":"function"},{"anonymous":False,"inputs":[{"indexed":True,"internalType":"address","name":"fromController","type":"address"},{"indexed":True,"internalType":"address","name":"toController","type":"address"}],"name":"ControllerAccessGranted","type":"event"},{"anonymous":False,"inputs":[{"indexed":True,"internalType":"address","name":"fromController","type":"address"},{"indexed":True,"internalType":"address","name":"toController","type":"address"}],"name":"ControllerAccessRevoked","type":"event"},{"anonymous":False,"inputs":[{"indexed":True,"internalType":"address","name":"controllerAddress","type":"address"}],"name":"ControllerAdded","type":"event"},{"inputs":[{"internalType":"address","name":"_controllerAddress","type":"address"},{"internalType":"address","name":"_switchAddress","type":"address"}],"name":"grantAccess","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_switchAddress1","type":"address"},{"internalType":"address","name":"_switchAddress2","type":"address"}],"name":"grantAccessSwitch","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_fromController","type":"address"},{"internalType":"address","name":"_toController","type":"address"}],"name":"grantControllerAccess","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_controllerAddress","type":"address"},{"internalType":"address","name":"_standbyController","type":"address"}],"name":"removeStandbyController","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_controllerAddress","type":"address"},{"internalType":"address","name":"_switchAddress","type":"address"}],"name":"revokeAccess","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_fromController","type":"address"},{"internalType":"address","name":"_toController","type":"address"}],"name":"revokeControllerAccess","outputs":[],"stateMutability":"nonpayable","type":"function"},{"anonymous":False,"inputs":[{"indexed":True,"internalType":"address","name":"controllerAddress","type":"address"},{"indexed":True,"internalType":"address","name":"standbyController","type":"address"}],"name":"StandbyControllerAdded","type":"event"},{"anonymous":False,"inputs":[{"indexed":True,"internalType":"address","name":"switchAddress","type":"address"}],"name":"SwitchAdded","type":"event"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"}],"name":"accessControl","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_controllerAddress","type":"address"},{"internalType":"address","name":"_switchAddress","type":"address"}],"name":"checkAccess","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_controllerAddress","type":"address"},{"internalType":"address","name":"_controllerAddress2","type":"address"}],"name":"checkAccessC","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_switchAddress1","type":"address"},{"internalType":"address","name":"_switchAddress2","type":"address"}],"name":"checkAccessSwitch","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"controllers","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"}],"name":"standbyControllers","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"switches","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"}]
    address = "0x0314121674134A7463c17343406ad44951424C09"
    contract = web3.eth.contract(address=address, abi=abi)
    
    #Function used by Devices to get access Control betwen Devices (controller 1 and Controller 2):
    y = contract.functions.checkAccessC('0x7F53d082A31c065493A119800AE9B680a752b5F9','0x52f68B8c1c11DF43eDF0b47ba20952FF5d299218').call()
    y_1 = contract.functions.checkAccessC('0x7F53d082A31c065493A119800AE9B680a752b5F9','0x52f68B8c1c11DF43eDF0b47ba20952FF5d299218').call()
    
    #if topology_1(): 
    print("Get access status between controller1 and Controller2  : ",y)
    return y
    #elif topology_2():
    #print("Get access status between controller1 and Controller2  : ",y_1)
    #return y_1 
       
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

  

def topology_1():
    net = Mininet()

    #c0 = net.addController()
    c0 = net.addController(controller=DefaultController, ip='127.0.0.1', port=6653)

    s0 = net.addSwitch('s0')
    s1 = net.addSwitch('s1')
    

    h1 = net.addHost('h1')
    h0 = net.addHost('h0')
    h2 = net.addHost('h2')
    h3 = net.addHost('h3')

    net.addLink(h0, s0)
    net.addLink(h1, s0)
    net.addLink(s0, s1)
    net.addLink(h2, s1)
    net.addLink(h3, s1)

    h0.setIP('192.168.1.1/24')
    h1.setIP('192.168.1.2/24')
    h2.setIP('192.168.1.3/24')
    h3.setIP('192.168.1.4/24')
    
    net.build()
    net.start()


    # Check certificate validity
    certificate_valid = check_certificate_validity()

    # Check access control between controllers and switches
    access_control_CS = check_access_Controller_to_switch()

    # Check access control between switches
    access_control_SS = check_access_Switch_to_switch()
    
    # Check access control between controllers
    access_control_CC = check_access_Controller_to_contoller()          

    start_mininet_cli(net, certificate_valid, access_control_CS, access_control_SS, access_control_CC)
    
    
    
def topology_2():
    net = Mininet()

    c1 = net.addController(controller=DefaultController, ip='127.0.0.1', port=6654)

    s2 = net.addSwitch('s2')
    s3 = net.addSwitch('s3')
    

    h5 = net.addHost('h5')
    h4 = net.addHost('h4')
    h6 = net.addHost('h6')
    h7 = net.addHost('h7')

    net.addLink(h4, s2)
    net.addLink(h5, s2)
    net.addLink(s2, s3)
    net.addLink(h6, s3)
    net.addLink(h7, s3)

    h4.setIP('192.168.1.5/24')
    h5.setIP('192.168.1.6/24')
    h6.setIP('192.168.1.7/24')
    h7.setIP('192.168.1.8/24')
    
    net.build()
    net.start()
    # Check certificate validity
    certificate_valid = check_certificate_validity()

    # Check access control between controllers and switches
    access_control_CS = check_access_Controller_to_switch()

    # Check access control between switches
    access_control_SS = check_access_Switch_to_switch()
    
    # Check access control between controllers
    access_control_CC = check_access_Controller_to_contoller()          

    start_mininet_cli(net, certificate_valid, access_control_CS, access_control_SS, access_control_CC)
if __name__ == '__main__':

    setLogLevel( 'info' )

    topology_1()
    topology_2()
    