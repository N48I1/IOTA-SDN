from ryu.base import app_manager
from ryu.controller import ofp_event
from ryu.controller.handler import CONFIG_DISPATCHER, MAIN_DISPATCHER
from ryu.controller.handler import set_ev_cls
from ryu.ofproto import ofproto_v1_3
from ryu.lib.packet import packet
from ryu.lib.packet import ethernet
from ryu.lib.packet import arp
import logging
import urllib.request
import urllib.error
import json
import time
import sys
import urllib3
import os

# Create logs directory if it doesn't exist
os.makedirs('logs', exist_ok=True)

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Set up logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('logs/ryu_controller.log', mode='w')  # 'w' mode to overwrite previous logs
    ]
)

# Print startup message
print("\n=== Ryu Controller Starting ===")
print("Logs will be written to logs/ryu_controller.log")
print("===================================\n")

class SimpleSwitch(app_manager.RyuApp):
    OFP_VERSIONS = [ofproto_v1_3.OFP_VERSION]

    # Device addresses
    CONTROLLER_ADDRESS = "0x7F53d082A31c065493A119800AE9B680a752b5F9"
    SWITCH1_ADDRESS = "0x1E9eb2b168993C1c4e79a4B1A7082a1BDA1D3234"
    SWITCH2_ADDRESS = "0xac7c33305CaAB6e53955876374B97ED6203AD1D7"


    # Blockchain server configuration
    BLOCKCHAIN_SERVER = "http://127.0.0.1:5000"

    def __init__(self, *args, **kwargs):
        super(SimpleSwitch, self).__init__(*args, **kwargs)
        self.mac_to_port = {}
        self.logger = logging.getLogger(__name__)
        self.logger.info("SimpleSwitch initialized")
        print("SimpleSwitch initialized")
        
        # Wait for blockchain server to be ready
        self._wait_for_blockchain_server()

    def _wait_for_blockchain_server(self, max_retries=5, retry_delay=2):
        """Wait for the blockchain server to be ready"""
        self.logger.info(f"Attempting to connect to blockchain server at {self.BLOCKCHAIN_SERVER}")
        print(f"\n=== Connecting to Blockchain Server ===")
        print(f"Server URL: {self.BLOCKCHAIN_SERVER}")
        for i in range(max_retries):
            try:
                self.logger.debug(f"Making health check request to {self.BLOCKCHAIN_SERVER}/health")
                print(f"Attempt {i+1}/{max_retries}...")
                with urllib.request.urlopen(f'{self.BLOCKCHAIN_SERVER}/health') as response:
                    data = json.loads(response.read().decode())
                    self.logger.debug(f"Health check response: {data}")
                    print(f"Response: {data}")
                    if response.getcode() == 200 and data.get('web3_connected', False):
                        self.logger.info("Blockchain server is ready and connected to Web3")
                        print("Blockchain server is ready and connected to Web3")
                        return
                    else:
                        self.logger.warning(f"Blockchain server responded but Web3 not connected: {data}")
                        print(f"Warning: Blockchain server responded but Web3 not connected: {data}")
            except urllib.error.URLError as e:
                self.logger.warning(f"Blockchain server not ready, attempt {i+1}/{max_retries}: {e}")
                print(f"Warning: Blockchain server not ready, attempt {i+1}/{max_retries}: {e}")
            except json.JSONDecodeError as e:
                self.logger.warning(f"Invalid JSON response from blockchain server: {e}")
                print(f"Warning: Invalid JSON response from blockchain server: {e}")
            except Exception as e:
                self.logger.warning(f"Unexpected error checking blockchain server: {e}")
                print(f"Warning: Unexpected error checking blockchain server: {e}")
            time.sleep(retry_delay)
        self.logger.error("Failed to connect to blockchain server after maximum retries")
        print("Error: Failed to connect to blockchain server after maximum retries")

    def _make_request(self, url):
        """Make an HTTP request and return the JSON response"""
        self.logger.debug(f"Making request to: {url}")
        print(f"\nMaking request to: {url}")
        try:
            with urllib.request.urlopen(url) as response:
                data = json.loads(response.read().decode())
                self.logger.debug(f"Response from {url}: {data}")
                print(f"Response: {data}")
                if response.getcode() == 200:
                    return data
                self.logger.error(f"Request failed with status code: {response.getcode()}")
                print(f"Error: Request failed with status code: {response.getcode()}")
                return None
        except urllib.error.HTTPError as e:
            try:
                error_data = json.loads(e.read().decode())
                self.logger.error(f"HTTP Error {e.code}: {error_data}")
                print(f"HTTP Error {e.code}: {error_data}")
            except:
                self.logger.error(f"HTTP Error {e.code}: {e.reason}")
                print(f"HTTP Error {e.code}: {e.reason}")
            return None
        except (urllib.error.URLError, json.JSONDecodeError) as e:
            self.logger.error(f"Error making request to {url}: {e}")
            print(f"Error making request to {url}: {e}")
            return None
        except Exception as e:
            self.logger.error(f"Unexpected error in _make_request: {e}")
            print(f"Unexpected error in _make_request: {e}")
            return None

    def check_access(self, src_address, dst_address):
        """Check if access is allowed between two devices"""
        try:
            self.logger.info(f"Checking access from {src_address} to {dst_address}")
            print(f"\n=== Checking Access ===")
            print(f"From: {src_address}")
            print(f"To: {dst_address}")
            url = f'{self.BLOCKCHAIN_SERVER}/check_access/{src_address}/{dst_address}'
            response = self._make_request(url)
            if response and 'access_granted' in response:
                result = response['access_granted']
                self.logger.info(f"Access check result: {result}")
                print(f"Access granted: {result}")
                return result
            self.logger.error("Invalid response format from access check")
            print("Error: Invalid response format from access check")
            return False
        except Exception as e:
            self.logger.error(f"Unexpected error in check_access: {e}")
            print(f"Error in check_access: {e}")
            return False

    def check_certificate(self, address):
        """Check if a device's certificate is valid"""
        try:
            self.logger.info(f"Checking certificate for {address}")
            print(f"\n=== Checking Certificate ===")
            print(f"Address: {address}")
            url = f'{self.BLOCKCHAIN_SERVER}/check_certificate/{address}'
            response = self._make_request(url)
            if response and 'certificate_valid' in response:
                result = response['certificate_valid']
                self.logger.info(f"Certificate check result: {result}")
                print(f"Certificate valid: {result}")
                return result
            self.logger.error("Invalid response format from certificate check")
            print("Error: Invalid response format from certificate check")
            return False
        except Exception as e:
            self.logger.error(f"Unexpected error in check_certificate: {e}")
            print(f"Error in check_certificate: {e}")
            return False

    @set_ev_cls(ofp_event.EventOFPSwitchFeatures, CONFIG_DISPATCHER)
    def switch_features_handler(self, ev):
        datapath = ev.msg.datapath
        ofproto = datapath.ofproto
        parser = datapath.ofproto_parser

        self.logger.info("Switch %s connected", datapath.id)
        print(f"\n=== Switch {datapath.id} Connected ===")

        # Only check the SDN authority certificate (not the switch)
        sdn_authority_address = "0xC184836543aBd0B70ffb2A8083eEf57F829ACD62"
        self.logger.info(f"Checking certificate for SDN authority: {sdn_authority_address}")
        print(f"Checking certificate for SDN authority: {sdn_authority_address}")
        if not self.check_certificate(sdn_authority_address):
            self.logger.error("SDN authority certificate is not valid")
            print("Error: SDN authority certificate is not valid")
            return

        # Install table-miss flow entry
        match = parser.OFPMatch()
        actions = [parser.OFPActionOutput(ofproto.OFPP_CONTROLLER,
                                        ofproto.OFPCML_NO_BUFFER)]
        self.add_flow(datapath, 0, match, actions)
        self.logger.info("Installed table-miss flow entry for switch %s", datapath.id)
        print(f"Installed table-miss flow entry for switch {datapath.id}")

    def add_flow(self, datapath, priority, match, actions):
        ofproto = datapath.ofproto
        parser = datapath.ofproto_parser

        inst = [parser.OFPInstructionActions(ofproto.OFPIT_APPLY_ACTIONS,
                                           actions)]
        mod = parser.OFPFlowMod(datapath=datapath, priority=priority,
                              match=match, instructions=inst)
        datapath.send_msg(mod)
        self.logger.debug(f"Added flow rule: priority={priority}, match={match}, actions={actions}")
        print(f"Added flow rule: priority={priority}, match={match}, actions={actions}")

    @set_ev_cls(ofp_event.EventOFPPacketIn, MAIN_DISPATCHER)
    def _packet_in_handler(self, ev):
        msg = ev.msg
        datapath = msg.datapath
        ofproto = datapath.ofproto
        parser = datapath.ofproto_parser
        in_port = msg.match['in_port']

        pkt = packet.Packet(msg.data)
        eth = pkt.get_protocols(ethernet.ethernet)[0]
        pkt_arp = pkt.get_protocol(arp.arp)

        # Always flood ARP packets before any access control logic
        if pkt_arp:
            actions = [parser.OFPActionOutput(ofproto.OFPP_FLOOD)]
            out = parser.OFPPacketOut(datapath=datapath, buffer_id=msg.buffer_id,
                                      in_port=in_port, actions=actions, data=msg.data)
            datapath.send_msg(out)
            return

        dst = eth.dst
        src = eth.src

        # Skip logging for IPv6 multicast packets
        if dst.startswith('33:33'):
            return

        dpid = datapath.id
        self.mac_to_port.setdefault(dpid, {})

        # Learn a mac address to avoid FLOOD next time
        self.mac_to_port[dpid][src] = in_port

        # Find the output port for the destination MAC
        if dst in self.mac_to_port[dpid]:
            out_port = self.mac_to_port[dpid][dst]
        else:
            out_port = ofproto.OFPP_FLOOD

        # Determine if src and dst are on the same switch
        src_port = self.mac_to_port[dpid][src]
        dst_port = self.mac_to_port[dpid].get(dst, None)

        # If both MACs are known and on the same switch, always allow
        if dst_port is not None and src_port == dst_port:
            allow = True
        else:
            # Inter-switch traffic: check access between switches
            if dpid == 1:
                # Traffic from s1 to s2
                allow = self.check_access(self.SWITCH1_ADDRESS, self.SWITCH2_ADDRESS)
            elif dpid == 2:
                # Traffic from s2 to s1
                allow = self.check_access(self.SWITCH2_ADDRESS, self.SWITCH1_ADDRESS)
            else:
                allow = False

        if not allow:
            # Access denied: install drop rule
            match = parser.OFPMatch(in_port=in_port, eth_dst=dst)
            actions = []
            self.add_flow(datapath, 2, match, actions)
            self.logger.info(f"Access denied: drop rule installed for {src} -> {dst}")
            print(f"Access denied: drop rule installed for {src} -> {dst}")
            return

        actions = [parser.OFPActionOutput(out_port)]

        # Install a flow to avoid packet_in next time
        if out_port != ofproto.OFPP_FLOOD:
            match = parser.OFPMatch(in_port=in_port, eth_dst=dst)
            self.add_flow(datapath, 1, match, actions)
            self.logger.info(f"Flow entry added for {src} -> {dst} via port {out_port}")
            print(f"Flow entry added for {src} -> {dst} via port {out_port}")

        data = None
        if msg.buffer_id == ofproto.OFP_NO_BUFFER:
            data = msg.data

        out = parser.OFPPacketOut(datapath=datapath, buffer_id=msg.buffer_id,
                                  in_port=in_port, actions=actions, data=data)
        datapath.send_msg(out)