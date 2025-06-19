from mininet.topo import Topo
from mininet.node import Node

class LinuxRouter(Node):
    def config(self, **params):
        super(LinuxRouter, self).config(**params)
        self.cmd('sysctl net.ipv4.ip_forward=1')

    def terminate(self):
        self.cmd('sysctl net.ipv4.ip_forward=0')
        super(LinuxRouter, self).terminate()

class TwoSwitchTopo(Topo):
    def build(self):
        # Define your switches, hosts, and links here
        s1 = self.addSwitch('s1')
        s2 = self.addSwitch('s2')
        r1 = self.addNode('r1', cls=LinuxRouter, ip='10.0.1.1/24')
        
        h1 = self.addHost('h1', ip='10.0.1.10/24', defaultRoute='via 10.0.1.1')
        h2 = self.addHost('h2', ip='10.0.1.11/24', defaultRoute='via 10.0.1.1')
        h3 = self.addHost('h3', ip='10.0.2.10/24', defaultRoute='via 10.0.2.1')
        h4 = self.addHost('h4', ip='10.0.2.11/24', defaultRoute='via 10.0.2.1')

        self.addLink(h1, s1)
        self.addLink(h2, s1)
        self.addLink(h3, s2)
        self.addLink(h4, s2)
        self.addLink(s1, r1, intfName2='r1-eth1', params2={'ip': '10.0.1.1/24'})
        self.addLink(s2, r1, intfName2='r1-eth2', params2={'ip': '10.0.2.1/24'})

topos = {
    'twoSwitchTopo': TwoSwitchTopo
}
