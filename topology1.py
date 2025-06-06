from mininet.topo import Topo
from mininet.net import Mininet
from mininet.node import Controller, OVSKernelSwitch, UserSwitch, DefaultController
from mininet.cli import CLI
from mininet.log import setLogLevel, info
from mininet.link import Link, TCLink

def topology_1():
    net = Mininet()

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
    
    return net

if __name__ == '__main__':
    setLogLevel('info')  # To see more info in the terminal
    net=topology_1();
    CLI(net)            # This opens a terminal where you can test
    net.stop()