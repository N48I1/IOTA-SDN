#!/usr/bin/env python3
import sys
import os

from topo import NetworkTopo, LinuxRouter


from mininet.topo import Topo
from mininet.net import Mininet
from mininet.node import Node
from mininet.log import setLogLevel, info
from mininet.cli import CLI
import subprocess
import time
import requests
import json

# ANSI color codes
class Colors:
    BLUE = '\033[38;5;46m'
    GREEN = '\033[92m'  # Standard green
    HACKER_GREEN = '\033[94m'  # Bright hacker green
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

# Create logs directory if it doesn't exist
os.makedirs('logs', exist_ok=True)

# Set up logging
import logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('logs/topo.log', mode='w')
    ]
)
logger = logging.getLogger(__name__)


def check_blockchain_server():
    """Check if blockchain server is running and ready"""
    try:
        response = requests.get('http://127.0.0.1:5000/health')
        if response.status_code == 200:
            data = response.json()
            return data.get('web3_connected', False)
    except:
        return False
    return False

def check_certificate(address):
    """Check certificate status for a given address"""
    try:
        response = requests.get(f'http://127.0.0.1:5000/check_certificate/{address}')
        if response.status_code == 200:
            data = response.json()
            return data.get('certificate_valid', False)
    except:
        return False
    return False

def print_header(text):
    """Print a colored header"""
    print(f"\n{Colors.BLUE}{Colors.BOLD}=== {text} ==={Colors.ENDC}")

def print_status(text, status, is_valid=True):
    """Print a colored status message"""
    color = Colors.HACKER_GREEN if is_valid else Colors.RED
    print(f"{Colors.BLUE}{text}{Colors.ENDC}: {color}{status}{Colors.ENDC}")

def run():
    print('\033[38;2;255;0;0m'
'''

██╗ ██████╗ ████████╗ █████╗       ███████╗██████╗ ███╗   ██╗
██║██╔═══██╗╚══██╔══╝██╔══██╗      ██╔════╝██╔══██╗████╗  ██║
██║██║   ██║   ██║   ███████║█████╗███████╗██║  ██║██╔██╗ ██║
██║██║   ██║   ██║   ██╔══██║╚════╝╚════██║██║  ██║██║╚██╗██║
██║╚██████╔╝   ██║   ██║  ██║      ███████║██████╔╝██║ ╚████║
╚═╝ ╚═════╝    ╚═╝   ╚═╝  ╚═╝      ╚══════╝╚═════╝ ╚═╝  ╚═══╝
                                                            
\033[0m''')
    # Start blockchain server if not already running
    if not check_blockchain_server():
        print_header("Starting Blockchain Server")
        blockchain_server = subprocess.Popen(['python3', 'blockchain_server.py'],
                                          stdout=subprocess.PIPE,
                                          stderr=subprocess.PIPE)
        time.sleep(2)  # Wait for server to start

    # Start Ryu controller
    print_header("Starting Ryu Controller")
    controller = subprocess.Popen(['./ryu-env-py39/bin/ryu-manager', 'ryu_controller.py'],
                                stdout=subprocess.PIPE,
                                stderr=subprocess.PIPE)
    time.sleep(2)  # Wait for controller to start

    # Create and start Mininet network
    print_header("Starting Mininet Network")
    topo = NetworkTopo()
    net = Mininet(topo=topo, controller=None)
    net.start()

    # Configure switches to connect to controller
    print_header("Configuring Switches")
    for switch in net.switches:
        switch.cmd('ovs-vsctl set-controller %s tcp:127.0.0.1:6653' % switch.name)
        print(f"{Colors.BLUE}Configured {switch.name}{Colors.ENDC} to connect to controller")

    # Wait for controller connection
    print_header("Waiting for Controller Connection")
    time.sleep(5)  # Give time for switches to connect

    # Check certificate status for each switch
    print_header("Certificate Status")
    sdn_address = '0xC184836543aBd0B70ffb2A8083eEf57F829ACD62'
    controller_address = '0x7F53d082A31c065493A119800AE9B680a752b5F9'
    switch_addresses = {
        's1': '0x1E9eb2b168993C1c4e79a4B1A7082a1BDA1D3234',
        's2': '0xac7c33305CaAB6e53955876374B97ED6203AD1D7'
    }

    # Check SDN certificate
    cert_status = check_certificate(sdn_address)
    status_str = "VALID" if cert_status else "INVALID"
    print_status(f"SDN Controller ({sdn_address})", status_str, cert_status)

    print_header("Access Control Status")
    
    # Check access between controller and switches
    print(f"\n{Colors.BLUE}Controller to Switch Access:{Colors.ENDC}")
    for switch_name, address in switch_addresses.items():
        access = check_access(controller_address, address)
        print_status(f"Controller -> {switch_name}", "ALLOWED" if access else "DENIED", access)
        access = check_access(address, controller_address)
        print_status(f"{switch_name} -> Controller", "ALLOWED" if access else "DENIED", access)

    # Check access between switches
    print(f"\n{Colors.BLUE}Switch to Switch Access:{Colors.ENDC}")
    s1_to_s2 = check_access(switch_addresses['s1'], switch_addresses['s2'])
    s2_to_s1 = check_access(switch_addresses['s2'], switch_addresses['s1'])
    
    print_status("s1 -> s2", "ALLOWED" if s1_to_s2 else "DENIED", s1_to_s2)
    print_status("s2 -> s1", "ALLOWED" if s2_to_s1 else "DENIED", s2_to_s1)

    print_header("Network Ready")
    print(f"{Colors.BLUE}You can now test connectivity using the Mininet CLI.{Colors.ENDC}")
    print(f"{Colors.BLUE}Example commands:{Colors.ENDC}")
    print(f"  {Colors.HACKER_GREEN}h1 ping h2{Colors.ENDC}    - Test connectivity between h1 and h2 (same switch)")
    print(f"  {Colors.HACKER_GREEN}h1 ping h3{Colors.ENDC}    - Test connectivity between h1 and h3 (different switches)")
    print(f"  {Colors.HACKER_GREEN}h1 ping h4{Colors.ENDC}    - Test connectivity between h1 and h4 (different switches)")
    print(f"  {Colors.HACKER_GREEN}h3 ping h4{Colors.ENDC}    - Test connectivity between h3 and h4 (same switch)")
    print(f"  {Colors.RED}exit{Colors.ENDC}          - Exit Mininet CLI and clean up")

    CLI(net)
    net.stop()
    controller.terminate()
    blockchain_server.terminate()

def check_access(source, target):
    """Check access control between two addresses"""
    try:
        response = requests.get(f'http://127.0.0.1:5000/check_access/{source}/{target}')
        if response.status_code == 200:
            data = response.json()
            return data.get('access_granted', False)
    except:
        return False
    return False

if __name__ == '__main__':
    setLogLevel('info')
    run() 