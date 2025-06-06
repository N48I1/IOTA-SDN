from mininet.topo import Topo
from mininet.net import Mininet
from mininet.node import OVSKernelSwitch, UserSwitch
from mininet.cli import CLI
from mininet.log import setLogLevel, info
from mininet.link import Link, TCLink
from BlockchainController import BlockchainController

# Device addresses (as registered on blockchain)
CONTROLLER_1 = "0xC95449F9a0eDf900E7a91B43eA982aF6cE7C411B"  # c0
CONTROLLER_2 = "0xDc6124e3E177eFd4e809f68c59002285BaBB9499"  # c1 (optional)
SWITCH_1 = "0x1e8Ca3B2af6209b92e9181EC689447c9Ec032Ae3"      # s0
SWITCH_2 = "0xde84b29a82E908f812Ce153748d30aaae10713dE"      # s1

def blockchain_topology():
    """Create a topology with blockchain-aware controllers"""
    net = Mininet()

    info('*** Adding blockchain-aware controllers\n')
    c0 = net.addController(
        'c0', 
        controller=BlockchainController,
        blockchain_address=CONTROLLER_1
    )
    
    c1 = net.addController(
        'c1', 
        controller=BlockchainController,
        blockchain_address=CONTROLLER_2,
        port=6654  # Use different port for second controller
    )

    info('*** Adding switches\n')
    s0 = net.addSwitch('s0')
    s1 = net.addSwitch('s1')
    
    # Store blockchain addresses for switches
    s0.blockchain_address = SWITCH_1
    s1.blockchain_address = SWITCH_2
    
    info('*** Adding hosts\n')
    h0 = net.addHost('h0', ip='192.168.1.1/24')
    h1 = net.addHost('h1', ip='192.168.1.2/24')
    h2 = net.addHost('h2', ip='192.168.1.3/24')
    h3 = net.addHost('h3', ip='192.168.1.4/24')

    info('*** Creating links\n')
    net.addLink(h0, s0)
    net.addLink(h1, s0)
    net.addLink(s0, s1)
    net.addLink(h2, s1)
    net.addLink(h3, s1)
    
    info('*** Building network\n')
    net.build()
    
    return net

if __name__ == '__main__':
    setLogLevel('info')
    net = blockchain_topology()
    
    info('*** Starting network\n')
    net.start()
    
    info('*** Running CLI\n')
    CLI(net)
    
    info('*** Stopping network\n')
    net.stop()