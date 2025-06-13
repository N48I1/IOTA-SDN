from ryu.base import app_manager
from ryu.controller import ofp_event
from ryu.controller.handler import CONFIG_DISPATCHER, MAIN_DISPATCHER
from ryu.controller.handler import set_ev_cls
from ryu.ofproto import ofproto_v1_3
from ryu.lib.packet import packet
from ryu.lib.packet import ethernet
import logging
import urllib.request
import urllib.error
import json
import time
import sys

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

class SimpleSwitch(app_manager.RyuApp):
    OFP_VERSIONS = [ofproto_v1_3.OFP_VERSION]

    # Device addresses
    CONTROLLER_ADDRESS = "0x7F53d082A31c065493A119800AE9B680a752b5F9"
    SWITCH1_ADDRESS = "0x1E9eb2b168993C1c4e79a4B1A7082a1BDA1D3234"
    SWITCH2_ADDRESS = "0xac7c33305CaAB6e53955876374B97ED6203AD1D7"
    SWITCH3_ADDRESS = "0x5eE1BEdd2E19DebFdD62eA57BDD1AcF8bf36C58A"
    CONTROLLER2_ADDRESS = "0x52f68B8c1c11DF43eDF0b47ba20952FF5d299218"

    # Blockchain server configuration
    BLOCKCHAIN_SERVER = "http://127.0.0.1:5000"

    def __init__(self, *args, **kwargs):
        super(SimpleSwitch, self).__init__(*args, **kwargs)
        self.mac_to_port = {}
        self.logger = logging.getLogger(__name__)
        self.logger.info("SimpleSwitch initialized")
        
        # Wait for blockchain server to be ready
        self._wait_for_blockchain_server()

    def _wait_for_blockchain_server(self, max_retries=5, retry_delay=2):
        """Wait for the blockchain server to be ready"""
        for i in range(max_retries):
            try:
                with urllib.request.urlopen(f'{self.BLOCKCHAIN_SERVER}/health') as response:
                    if response.getcode() == 200:
                        self.logger.info("Blockchain server is ready")
                        return
            except urllib.error.URLError as e:
                self.logger.warning(f"Blockchain server not ready, attempt {i+1}/{max_retries}: {e}")
                time.sleep(retry_delay)
        self.logger.error("Failed to connect to blockchain server")

    def _make_request(self, url):
        """Make an HTTP request and return the JSON response"""
        try:
            with urllib.request.urlopen(url) as response:
                if response.getcode() == 200:
                    return json.loads(response.read().decode())
                return None
        except (urllib.error.URLError, json.JSONDecodeError) as e:
            self.logger.error(f"Error making request to {url}: {e}")
            return None

    def check_access(self, src_address, dst_address):
        """Check if access is allowed between two devices"""
        try:
            self.logger.info(f"Checking access from {src_address} to {dst_address}")
            url = f'{self.BLOCKCHAIN_SERVER}/check_access/{src_address}/{dst_address}'
            response = self._make_request(url)
            if response and 'result' in response:
                result = response['result']
                self.logger.info(f"Access check result: {result}")
                return result
            return False
        except Exception as e:
            self.logger.error(f"Unexpected error in check_access: {e}")
            return False

    def check_certificate(self, address):
        """Check if a device's certificate is valid"""
        try:
            self.logger.info(f"Checking certificate for {address}")
            url = f'{self.BLOCKCHAIN_SERVER}/check_certificate/{address}'
            response = self._make_request(url)
            if response and 'result' in response:
                result = response['result']
                self.logger.info(f"Certificate check result: {result}")
                return result
            return False
        except Exception as e:
            self.logger.error(f"Unexpected error in check_certificate: {e}")
            return False

    @set_ev_cls(ofp_event.EventOFPSwitchFeatures, CONFIG_DISPATCHER)
    def switch_features_handler(self, ev):
        datapath = ev.msg.datapath
        ofproto = datapath.ofproto
        parser = datapath.ofproto_parser

        self.logger.info("Switch %s connected", datapath.id)

        # Check certificate validity
        switch_address = self.SWITCH1_ADDRESS if datapath.id == 1 else self.SWITCH2_ADDRESS
        if not self.check_certificate(switch_address):
            self.logger.error("Switch %s certificate is not valid", datapath.id)
            return

        # Install table-miss flow entry
        match = parser.OFPMatch()
        actions = [parser.OFPActionOutput(ofproto.OFPP_CONTROLLER,
                                        ofproto.OFPCML_NO_BUFFER)]
        self.add_flow(datapath, 0, match, actions)

    def add_flow(self, datapath, priority, match, actions):
        ofproto = datapath.ofproto
        parser = datapath.ofproto_parser

        inst = [parser.OFPInstructionActions(ofproto.OFPIT_APPLY_ACTIONS,
                                           actions)]
        mod = parser.OFPFlowMod(datapath=datapath, priority=priority,
                              match=match, instructions=inst)
        datapath.send_msg(mod)

    @set_ev_cls(ofp_event.EventOFPPacketIn, MAIN_DISPATCHER)
    def _packet_in_handler(self, ev):
        msg = ev.msg
        datapath = msg.datapath
        ofproto = datapath.ofproto
        parser = datapath.ofproto_parser
        in_port = msg.match['in_port']

        pkt = packet.Packet(msg.data)
        eth = pkt.get_protocols(ethernet.ethernet)[0]

        dst = eth.dst
        src = eth.src

        # Skip logging for IPv6 multicast packets
        if dst.startswith('33:33'):
            return

        dpid = datapath.id
        self.mac_to_port.setdefault(dpid, {})

        # Get device addresses
        src_switch = self.SWITCH1_ADDRESS if dpid == 1 else self.SWITCH2_ADDRESS
        dst_switch = self.SWITCH2_ADDRESS if dpid == 1 else self.SWITCH1_ADDRESS

        # Check access control
        if not self.check_access(src_switch, dst_switch):
            self.logger.warning("Access denied between switches %s and %s", src_switch, dst_switch)
            return

        # Learn a mac address to avoid FLOOD next time
        self.mac_to_port[dpid][src] = in_port
        self.logger.info("Switch %s: Learned MAC %s on port %s", dpid, src, in_port)

        if dst in self.mac_to_port[dpid]:
            out_port = self.mac_to_port[dpid][dst]
            self.logger.info("Switch %s: Forwarding packet from %s to %s via port %s", 
                           dpid, src, dst, out_port)
        else:
            out_port = ofproto.OFPP_FLOOD
            self.logger.info("Switch %s: Flooding packet from %s to %s", dpid, src, dst)

        actions = [parser.OFPActionOutput(out_port)]

        # Install a flow to avoid packet_in next time
        if out_port != ofproto.OFPP_FLOOD:
            match = parser.OFPMatch(in_port=in_port, eth_dst=dst)
            self.add_flow(datapath, 1, match, actions)
            self.logger.info("Switch %s: Added flow entry for %s -> %s via port %s",
                           dpid, src, dst, out_port)

        data = None
        if msg.buffer_id == ofproto.OFP_NO_BUFFER:
            data = msg.data

        out = parser.OFPPacketOut(datapath=datapath, buffer_id=msg.buffer_id,
                                in_port=in_port, actions=actions, data=data)
        datapath.send_msg(out)