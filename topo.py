import sys
import os
print("Python executable:", sys.executable)
print("Python version:", sys.version)
print("Current working directory:", os.getcwd())
print("PYTHONPATH:", os.environ.get('PYTHONPATH', 'Not set'))

from mininet.topo import Topo
from mininet.net import Mininet
from mininet.node import OVSSwitch, Controller
from mininet.cli import CLI
from mininet.log import setLogLevel
import subprocess
import time

class SimpleTopo(Topo):
    def __init__(self):
        Topo.__init__(self)
        
        # Add hosts
        h1 = self.addHost('h1', ip='10.0.0.1/24')
        h2 = self.addHost('h2', ip='10.0.0.2/24')
        h3 = self.addHost('h3', ip='10.0.0.3/24')
        h4 = self.addHost('h4', ip='10.0.0.4/24')
        
        # Add switches
        s1 = self.addSwitch('s1', protocols='OpenFlow13')
        s2 = self.addSwitch('s2', protocols='OpenFlow13')
        
        # Add links
        # Hosts to switches
        self.addLink(h1, s1)
        self.addLink(h2, s1)
        self.addLink(h3, s2)
        self.addLink(h4, s2)
        
        # Inter-switch link
        self.addLink(s1, s2)

def run():
    # Use the exact path to ryu-manager
    ryu_manager = './ryu-env-py39/bin/ryu-manager'
    
    # Start Ryu controller in the background
    print("Starting Ryu controller...")
    ryu_process = subprocess.Popen([ryu_manager, 'simple_switch.py'])
    
    # Give the controller time to start
    print("Waiting for controller to start...")
    time.sleep(3)
         # Create and start the network
    print("Creating network...")
    topo = SimpleTopo()
    net = Mininet(topo=topo, switch=OVSSwitch, controller=None)
    net.start()
    
    # Configure switches to connect to controller
    print("Configuring switches...")
    s1 = net.get('s1')
    s2 = net.get('s2')
    s1.cmd('ovs-vsctl set-controller s1 tcp:127.0.0.1:6633')
    s2.cmd('ovs-vsctl set-controller s2 tcp:127.0.0.1:6633')
    
    # Wait for controller connection
    print("Waiting for controller connection...")
    time.sleep(2)
    
    print("\nNetwork is ready! You can now test connectivity using the Mininet CLI.")
    print("Example commands:")
    print("  h1 ping h2    - Test connectivity between h1 and h2 (same switch)")
    print("  h1 ping h3    - Test connectivity between h1 and h3 (different switches)")
    print("  h1 ping h4    - Test connectivity between h1 and h4 (different switches)")
    print("  h3 ping h4    - Test connectivity between h3 and h4 (same switch)")
    print("  exit          - Exit Mininet CLI and clean up\n")
    
    # Start the CLI
    CLI(net)
    
    # Clean up
    net.stop()
    ryu_process.terminate()

if __name__ == '__main__':
    setLogLevel('info')
    run() 