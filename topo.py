from mininet.topo import Topo
from mininet.node import Node, RemoteController
from mininet.log import setLogLevel, info
from mininet.net import Mininet
from mininet.cli import CLI  # <-- ✅ This fixes the error

class LinuxRouter(Node):
    def config(self, **params):
        super(LinuxRouter, self).config(**params)
        self.cmd('sysctl net.ipv4.ip_forward=1')

    def terminate(self):
        self.cmd('sysctl net.ipv4.ip_forward=0')
        super(LinuxRouter, self).terminate()

class NetworkTopo(Topo):
    def build(self, **_opts):
        # Add switches
        s1 = self.addSwitch('s1')
        s2 = self.addSwitch('s2')

        # Add hosts
        h1 = self.addHost('h1', ip='10.0.1.10/24', defaultRoute='via 10.0.1.1')
        h2 = self.addHost('h2', ip='10.0.1.20/24', defaultRoute='via 10.0.1.1')
        h3 = self.addHost('h3', ip='10.0.2.10/24', defaultRoute='via 10.0.2.1')
        h4 = self.addHost('h4', ip='10.0.2.20/24', defaultRoute='via 10.0.2.1')

        # Add links
        self.addLink(h1, s1)
        self.addLink(h2, s1)
        self.addLink(h3, s2)
        self.addLink(h4, s2)
        self.addLink(s1, s2)

if __name__ == '__main__':
    setLogLevel('info')
    print("🚀 Starting Mininet Network...")
    
    topo = NetworkTopo()
    net = Mininet(topo=topo, controller=RemoteController)

    # Connect switches to your running Ryu controller on 127.0.0.1:6633
    controller = net.addController('c0', controller=RemoteController, ip='127.0.0.1', port=6633)

    net.start()
    print("✅ Mininet Network Started. Type 'exit' to quit.")
    CLI(net)  # interactive CLI to test pings
    net.stop()
