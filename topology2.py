from mininet.topo import Topo
from mininet.net import Mininet
from mininet.node import Controller, OVSKernelSwitch, UserSwitch, DefaultController
from mininet.cli import CLI
from mininet.log import setLogLevel, info
from mininet.link import Link, TCLink

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
    
    return net