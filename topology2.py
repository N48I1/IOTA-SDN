from mininet.topo import Topo
from mininet.net import Mininet
from mininet.node import DefaultController
from mininet.cli import CLI
from mininet.log import setLogLevel, info

def light_topology():
    net = Mininet(controller=DefaultController)

    info('*** Adding controller\n')
    c0 = net.addController('c0', controller=DefaultController, ip='127.0.0.1', port=6653)

    info('*** Adding switches\n')
    s1 = net.addSwitch('s1')
    s2 = net.addSwitch('s2')

    info('*** Adding hosts\n')
    h1 = net.addHost('h1', ip='192.168.10.1/24')
    h2 = net.addHost('h2', ip='192.168.10.2/24')
    h3 = net.addHost('h3', ip='192.168.10.3/24')
    h4 = net.addHost('h4', ip='192.168.10.4/24')
    h5 = net.addHost('h5', ip='192.168.10.5/24')
    h6 = net.addHost('h6', ip='192.168.10.6/24')

    info('*** Creating links\n')
    net.addLink(h1, s1)
    net.addLink(h2, s1)
    net.addLink(h3, s1)
    net.addLink(s1, s2)
    net.addLink(h4, s2)
    net.addLink(h5, s2)
    net.addLink(h6, s2)

    info('*** Starting network\n')
    net.build()
    net.start()

    return net

if __name__ == '__main__':
    setLogLevel('info')
    net = light_topology()
    CLI(net)
    net.stop()
