from ryu.base import app_manager
from ryu.controller import ofp_event
from ryu.controller.handler import MAIN_DISPATCHER, CONFIG_DISPATCHER, set_ev_cls
from ryu.ofproto import ofproto_v1_3
from ryu.lib.packet import packet
from ryu.lib.packet import ethernet
from ryu.controller import dpset

import json
import sys
import logging
import time
import threading
# from web3 import Web3 # Commented out
# from web3.middleware.proof_of_authority import ExtraDataToPOAMiddleware # Commented out

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# --- CONFIGURATION --- (Copying from mininet_blockchain_demo.py)
IOTA_RPC = "https://json-rpc.evm.testnet.iotaledger.net/"
AUTHORITY_CONTRACT_ADDRESS = "0xEDCc5EBd8a8b8549B4e0fd1B1f5C2DBC0B075870"
ACCESS_CONTROL_CONTRACT_ADDRESS = "0x4ed5d26faffdefc5f77edd12a1d10f5da474452f"
SWITCHES = {
    # Mapping DPID to blockchain addresses will be needed here or elsewhere
    # For now, let's just have the addresses
    's0': "0x1e8ca3b2af6209b92e9181ec689447c9ec032ae3",
    's1': "0xde84b29a82e908f812ce153748d30aaae10713de"
}

# Controller's blockchain address (You might need to define this)
CONTROLLER_ADDRESS = "0xC95449F9a0eDf900E7a91B43eA982aF6cE7C411B" # <-- **IMPORTANT: Replace with the actual blockchain address for your controller**

class CertRyuController(app_manager.RyuApp):
    OFP_VERSIONS = [ofproto_v1_3.OFP_VERSION]

    def __init__(self, *args, **kwargs):
        super(CertRyuController, self).__init__(*args, **kwargs)
        self.logger.info("Initialisation du contrôleur CertRyuController...")
        
        try:
            # --- Blockchain Interaction (Commented out to avoid import errors) ---
            # Connexion à la blockchain IOTA EVM Testnet
            # self.web3 = Web3(Web3.HTTPProvider(IOTA_RPC))
            # self.web3.middleware_onion.add(ExtraDataToPOAMiddleware) # Add PoA middleware

            # if not self.web3.is_connected():
            #      self.logger.error(f"Impossible de se connecter au nœud RPC: {IOTA_RPC}")
            #      #sys.exit(1) # Avoid exiting the Ryu app
            # else:
            #     self.logger.info(f"Connecté au nœud RPC: {IOTA_RPC}")
            #     self.logger.info(f"Dernier bloc: {self.web3.eth.block_number}")

            # Charger l'ABI et l'adresse du contrat AccessControl
            # try:
            #     with open('abi/AccessControl.json') as f:
            #         access_control_abi = json.load(f)
            #     self.access_control_contract = self.web3.eth.contract(address=ACCESS_CONTROL_CONTRACT_ADDRESS, abi=access_control_abi)
            #     self.logger.info(f"Contrat Access Control chargé: {ACCESS_CONTROL_CONTRACT_ADDRESS}")

            #      # Optional: Load and check Authority contract if needed in Ryu
            #     with open('abi/authority.json') as f:
            #          authority_abi = json.load(f)
            #     self.authority_contract = self.web3.eth.contract(address=AUTHORITY_CONTRACT_ADDRESS, abi=authority_abi)
            #     self.logger.info(f"Contrat Authority chargé: {AUTHORITY_CONTRACT_ADDRESS}")

            # except FileNotFoundError:
            #     self.logger.error("Fichier(s) ABI non trouvé(s). Assurez-vous que abi/authority.json et abi/AccessControl.json existent.")
            #     # Handle error appropriately
            # except json.JSONDecodeError:
            #      self.logger.error("Erreur de format JSON dans un fichier ABI.")
            #      # Handle error appropriately
            # except Exception as e:
            #     self.logger.error(f"Erreur lors du chargement des contrats: {str(e)}")
            #     # Handle error appropriately
            # --------------------------------------------------------------------

            # Initialize switch tracking
            self.dpid_to_address = {}
            # Initialize MAC address table for learning switch functionality
            self.mac_to_port = {}
            # Initialize active switches set
            self.active_switches = set()
            self.datapaths = {} # Keep track of connected datapaths
            self._echo_thread = threading.Thread(target=self._send_echo_requests)
            self._echo_thread.daemon = True
            self._echo_thread.start()
            
            self.logger.info("Initialisation de CertRyuController terminée.")
            self.logger.info("Le contrôleur est prêt à recevoir des connexions...")

        except Exception as e:
            self.logger.error(f"Erreur non gérée lors de l'initialisation de CertRyuController: {str(e)}", exc_info=True)
            sys.exit(1)

    @set_ev_cls(ofp_event.EventOFPHello, MAIN_DISPATCHER)
    def hello_handler(self, ev):
        msg = ev.msg
        datapath = msg.datapath
        self.logger.info(f"Hello reçu du switch {datapath.id}")

    @set_ev_cls(ofp_event.EventOFPEchoRequest, MAIN_DISPATCHER)
    def echo_request_handler(self, ev):
        msg = ev.msg
        datapath = msg.datapath
        ofproto = datapath.ofproto
        parser = datapath.ofproto_parser
        
        # Reply to echo request
        reply = parser.OFPEchoReply(datapath, msg.data)
        datapath.send_msg(reply)
        self.logger.info(f"Echo reply envoyé au switch {datapath.id}")

    @set_ev_cls(dpset.EventDP, MAIN_DISPATCHER)
    def _event_switch_enter_handler(self, ev):
        dp = ev.dp
        dpid = dp.id
        self.logger.info(f"Switch {dpid} connecté au contrôleur (EventDP)")
        self.active_switches.add(dpid)

    @set_ev_cls(ofp_event.EventOFPStateChange, MAIN_DISPATCHER)
    def _event_switch_leave_handler(self, ev):
        dp = ev.datapath
        if dp is None:
            return
        dpid = dp.id
        self.logger.info(f"Switch {dpid} déconnecté du contrôleur")
        if dpid in self.active_switches:
            self.active_switches.remove(dpid)
        if dpid in self.datapaths:
            del self.datapaths[dpid] # Remove datapath on disconnect

    @set_ev_cls(ofp_event.EventOFPErrorMsg, MAIN_DISPATCHER)
    def error_msg_handler(self, ev):
        msg = ev.msg
        self.logger.error(f"OFPErrorMsg received: type={msg.type}, code={msg.code}")
        self.logger.error(f"Error message data: {msg.data}")

    @set_ev_cls(ofp_event.EventOFPPortStatus, MAIN_DISPATCHER)
    def _port_status_handler(self, ev):
        msg = ev.msg
        reason = msg.reason
        port_no = msg.desc.port_no
        dpid = msg.datapath.id
        
        if reason == ofproto_v1_3.OFPPR_ADD:
            self.logger.info(f"Port {port_no} ajouté sur switch {dpid}")
        elif reason == ofproto_v1_3.OFPPR_DELETE:
            self.logger.info(f"Port {port_no} supprimé sur switch {dpid}")
        elif reason == ofproto_v1_3.OFPPR_MODIFY:
            self.logger.info(f"Port {port_no} modifié sur switch {dpid}")

    # CORRECTION PRINCIPALE: Utiliser CONFIG_DISPATCHER pour switch_features_handler
    @set_ev_cls(ofp_event.EventOFPSwitchFeatures, CONFIG_DISPATCHER)
    def switch_features_handler(self, ev):
        datapath = ev.msg.datapath
        self.datapaths[datapath.id] = datapath # Store datapath
        ofproto = datapath.ofproto
        parser = datapath.ofproto_parser
        dpid = datapath.id

        self.logger.info(f"=== Switch Features Handler appelé pour switch {dpid} ===")

        # Map DPID to blockchain address
        switch_blockchain_address = None
        if dpid == 1:  # s0
            switch_blockchain_address = SWITCHES['s0']
            self.dpid_to_address[dpid] = switch_blockchain_address
            self.logger.info(f"Mapped switch {dpid} to blockchain address {switch_blockchain_address} (s0)")
        elif dpid == 2:  # s1
            switch_blockchain_address = SWITCHES['s1']
            self.dpid_to_address[dpid] = switch_blockchain_address
            self.logger.info(f"Mapped switch {dpid} to blockchain address {switch_blockchain_address} (s1)")
        else:
            # Handle unexpected DPID values - might be due to Mininet configuration
            self.logger.warning(f"Unknown switch DPID {dpid}. Cannot map to blockchain address.")
            self.logger.info(f"Expected DPIDs: 1 (s0) or 2 (s1). Got: {dpid}")
            # For testing purposes, we'll still install basic flows
            switch_blockchain_address = "unknown"

        # --- Simplified Logic for Testing (Install basic flow) ---
        # With blockchain interaction commented out, we install a basic flow
        # to see if the Ryu application can start and interact with switches
        # This flow sends packets to the controller, useful for debugging packet_in
        match = parser.OFPMatch()
        actions = [parser.OFPActionOutput(ofproto.OFPP_CONTROLLER, ofproto.OFPCML_NO_BUFFER)]
        self.add_flow(datapath, 0, match, actions)
        self.logger.info(f"*** Flow rule installée pour switch {dpid} ***")

        # Send a barrier request to ensure the flow rule is installed
        req = parser.OFPBarrierRequest(datapath)
        datapath.send_msg(req)
        self.logger.info(f"Barrier request envoyée au switch {dpid}")

    def add_flow(self, datapath, priority, match, actions, buffer_id=None):
        ofproto = datapath.ofproto
        parser = datapath.ofproto_parser

        inst = [parser.OFPInstructionActions(ofproto.OFPIT_APPLY_ACTIONS, actions)]
        
        if buffer_id:
            mod = parser.OFPFlowMod(datapath=datapath, buffer_id=buffer_id,
                                  priority=priority, match=match, instructions=inst)
        else:
            mod = parser.OFPFlowMod(datapath=datapath, priority=priority,
                                  match=match, instructions=inst)
        datapath.send_msg(mod)
        self.logger.info(f"Flow rule ajoutée au switch {datapath.id} avec priorité {priority}")

    # PacketIn handler pour traiter les paquets arrivant au contrôleur
    @set_ev_cls(ofp_event.EventOFPPacketIn, MAIN_DISPATCHER)
    def packet_in_handler(self, ev):
        msg = ev.msg
        datapath = msg.datapath
        ofproto = datapath.ofproto
        parser = datapath.ofproto_parser
        in_port = msg.match['in_port']
        dpid = datapath.id

        self.logger.info(f"=== PacketIn reçu du switch {dpid} sur port {in_port} ===")

        try:
            pkt = packet.Packet(msg.data)
            eth = pkt.get_protocols(ethernet.ethernet)[0]
            
            if eth.ethertype == 0x88cc:  # LLDP packet, ignore
                return
            
            dst = eth.dst
            src = eth.src
            
            self.logger.info(f"Packet: src={src}, dst={dst}, in_port={in_port}")
            
            # Learn MAC address
            self.mac_to_port.setdefault(dpid, {})
            self.mac_to_port[dpid][src] = in_port
            
            if dst in self.mac_to_port[dpid]:
                out_port = self.mac_to_port[dpid][dst]
                self.logger.info(f"MAC {dst} apprise sur port {out_port}")
            else:
                out_port = ofproto.OFPP_FLOOD
                self.logger.info(f"MAC {dst} inconnue, flood")
            
            actions = [parser.OFPActionOutput(out_port)]
            
            # Install a flow to avoid packet_in next time
            if out_port != ofproto.OFPP_FLOOD:
                match = parser.OFPMatch(in_port=in_port, eth_dst=dst, eth_src=src)
                self.add_flow(datapath, 1, match, actions, buffer_id=msg.buffer_id)
                self.logger.info(f"Flow installée: {src} -> {dst} via port {out_port}")
                return
            
            # Send packet out
            data = None
            if msg.buffer_id == ofproto.OFP_NO_BUFFER:
                data = msg.data
            
            out = parser.OFPPacketOut(datapath=datapath, buffer_id=msg.buffer_id,
                                    in_port=in_port, actions=actions, data=data)
            datapath.send_msg(out)
            self.logger.info(f"PacketOut envoyé pour flood")
            
        except Exception as e:
            self.logger.error(f"Erreur lors du traitement du packet: {str(e)}", exc_info=True)

    def _send_echo_requests(self):
        # Periodically send echo requests to keep connections alive
        while True:
            for dp in list(self.datapaths.values()): # Iterate over a copy
                try:
                    parser = dp.ofproto_parser
                    echo_req = parser.OFPEchoRequest(dp, data=b'ryu_echo')
                    dp.send_msg(echo_req)
                    # self.logger.debug(f"Sent Echo Request to switch {dp.id}") # Uncomment for detailed debug
                except Exception as e:
                    self.logger.error(f"Failed to send Echo Request to switch {dp.id}: {e}")
            time.sleep(5) # Send every 5 seconds