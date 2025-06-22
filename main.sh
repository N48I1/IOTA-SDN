#!/bin/bash
echo -e '\033[38;2;255;0;0m
██╗ ██████╗ ████████╗ █████╗       ███████╗██████╗ ███╗   ██╗
██║██╔═══██╗╚══██╔══╝██╔══██╗      ██╔════╝██╔══██╗████╗  ██║
██║██║   ██║   ██║   ███████║█████╗███████╗██║  ██║██╔██╗ ██║
██║██║   ██║   ██║   ██╔══██║╚════╝╚════██║██║  ██║██║╚██╗██║
██║╚██████╔╝   ██║   ██║  ██║      ███████║██████╔╝██║ ╚████║
╚═╝ ╚═════╝    ╚═╝   ╚═╝  ╚═╝      ╚══════╝╚═════╝ ╚═╝  ╚═══╝
\033[0m'

# ========== Configuration ==========
BLOCKCHAIN_SCRIPT="blockchain_server.py"
RYU_SCRIPT="ryu_controller.py"
TOPO_FILE="network.py"
TOPO_NAME="twoSwitchTopo"
RYU_PORT=6653
RYU_ENV="./ryu-env-py39/bin/ryu-manager"

# ========== ANSI Colors ==========
RED='\033[1;31m'
GREEN='\033[1;32m'
BLUE='\033[1;34m'
YELLOW='\033[1;33m'
MAGENTA='\033[1;35m'
CYAN='\033[1;36m'
HEADER_GREEN='\033[38;5;46m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# ========== PID Storage ==========
BLOCKCHAIN_PID=""
RYU_PID=""

# ========== Functions ==========
function print_header() {
  echo -e "\n${HEADER_GREEN}${BOLD}========== $1 ==========${NC}"
}

function print_success() {
  echo -e "${GREEN}${BOLD}✓ SUCCESS:${NC} $1"
}

function print_error() {
  echo -e "${RED}${BOLD}✗ ERROR:${NC} $1"
}

function print_warning() {
  echo -e "${YELLOW}${BOLD}⚠ WARNING:${NC} $1"
}

function print_info() {
  echo -e "${CYAN}${BOLD}ℹ INFO:${NC} $1"
}

function ask_permission() {
  local service_name="$1"
  echo -e "\n${MAGENTA}${BOLD}Question:${NC} Do you want to launch ${BOLD}$service_name${NC}? (y/n): "
  read -r response
  case "$response" in
    [yY]|[yY][eE][sS]) return 0 ;;
    *) return 1 ;;
  esac
}

function check_file_exists() {
  local file="$1"
  local description="$2"
  if [[ ! -f "$file" ]]; then
    print_error "$description not found: $file"
    return 1
  fi
  return 0
}

function cleanup_on_exit() {
  print_header "Cleaning Up"
  
  # Cleanup Mininet
  print_info "Cleaning up Mininet..."
  sudo mn -c 2>/dev/null
  
  # Stop processes
  if [[ -n "$BLOCKCHAIN_PID" ]]; then
    print_info "Stopping Blockchain server (PID: $BLOCKCHAIN_PID)..."
    kill "$BLOCKCHAIN_PID" 2>/dev/null && print_success "Blockchain server stopped" || print_warning "Could not stop blockchain server"
  fi
  
  if [[ -n "$RYU_PID" ]]; then
    print_info "Stopping Ryu controller (PID: $RYU_PID)..."
    kill "$RYU_PID" 2>/dev/null && print_success "Ryu controller stopped" || print_warning "Could not stop ryu controller"
  fi
  
  # Force kill if needed
  pkill -f "$BLOCKCHAIN_SCRIPT" 2>/dev/null
  pkill -f "$RYU_SCRIPT" 2>/dev/null
  
  print_success "Cleanup completed"
}

# Trap for clean exit handling
trap cleanup_on_exit EXIT INT TERM

# ========== Pre-flight Checks ==========
print_header "Pre-flight Checks"

# Check required files
check_file_exists "$BLOCKCHAIN_SCRIPT" "Blockchain script" || exit 1
check_file_exists "$RYU_SCRIPT" "Ryu controller script" || exit 1
check_file_exists "$TOPO_FILE" "Topology file" || exit 1

# Check for jq
command -v jq >/dev/null 2>&1 || { print_error "jq is not installed. Please install it to parse API responses (e.g., 'sudo apt-get install jq')."; exit 1; }

# Check if Ryu is installed
if [[ ! -f "$RYU_ENV" ]]; then
  print_error "Ryu manager not found: $RYU_ENV"
  exit 1
fi

# Check sudo privileges for Mininet
if ! sudo -n true 2>/dev/null; then
  print_warning "Sudo privileges required for Mininet"
  sudo -v || exit 1
fi

print_success "All pre-flight checks passed"

# ========== Blockchain Server ==========
if ask_permission "the Blockchain server"; then
  print_header "Launching Blockchain Server"
  
  # Launch blockchain server in background
  gnome-terminal --title="Blockchain Server" -- bash -c "
    echo -e '${YELLOW}>> Starting Blockchain server...${NC}';
    source ryu-env/bin/activate 2>/dev/null || echo 'No virtual environment found';
    python3 $BLOCKCHAIN_SCRIPT;
    echo -e '${RED}Blockchain server terminated.${NC}';
    read -p 'Press Enter to close...'
  " &
  
  BLOCKCHAIN_PID=$!
  sleep 3 # Give server time to start
  
  print_success "Blockchain server launched in a new terminal window"
else
  print_info "Blockchain server skipped by user"
fi

# ========== Ryu Controller ==========
if ask_permission "the Ryu controller"; then
  print_header "Launching Ryu Controller"
  
  # Launch Ryu controller in background
  gnome-terminal --title="Ryu Controller" -- bash -c "
    echo -e '${YELLOW}>> Starting Ryu controller...${NC}';
    source ryu-env-py39/bin/activate 2>/dev/null || echo 'No virtual environment found';
    $RYU_ENV $RYU_SCRIPT;
    echo -e '${RED}Ryu controller terminated.${NC}';
    read -p 'Press Enter to close...'
  " &
  
  RYU_PID=$!
  sleep 2
  
  print_success "Ryu controller launched in a new terminal window"

else
  print_info "Ryu controller skipped by user"
fi

# ========== Blockchain Verification ==========
# This section will only run if the blockchain server was started
if [[ -n "$BLOCKCHAIN_PID" ]]; then
  print_header "Blockchain Verification"

  # --- Helper functions for verification ---
  function check_blockchain_server_health() {
    print_info "Checking blockchain server health..."
    local response
    response=$(curl --silent --max-time 5 http://127.0.0.1:5000/health)
    if [[ $? -ne 0 ]]; then
      print_error "Could not connect to the blockchain server at http://127.0.0.1:5000."
      return 1
    fi
    local connected
    connected=$(echo "$response" | jq -r '.web3_connected')
    if [[ "$connected" == "true" ]]; then
      print_success "Blockchain server is running and connected to Web3."
      return 0
    else
      print_error "Blockchain server is up but NOT connected to Web3."
      return 1
    fi
  }

  function check_certificate() {
    local address="$1"
    local name="$2"
    local response
    response=$(curl --silent --max-time 5 "http://127.0.0.1:5000/check_certificate/$address")
    if [[ $? -ne 0 ]]; then
      print_warning "Failed to get certificate status for $name ($address)."
      return 1
    fi
    local valid
    valid=$(echo "$response" | jq -r '.certificate_valid')
    if [[ "$valid" == "true" ]]; then
      echo -e "${CYAN}  ${BOLD}CERT [✓]${NC} for ${BOLD}$name${NC}: ${GREEN}VALID${NC}"
      return 0
    else
      echo -e "${YELLOW}  ${BOLD}CERT [✗]${NC} for ${BOLD}$name${NC}: ${RED}INVALID${NC}"
      return 1
    fi
  }

  function check_access() {
    local src_addr="$1"
    local tgt_addr="$2"
    local src_name="$3"
    local tgt_name="$4"
    local response
    response=$(curl --silent --max-time 5 "http://127.0.0.1:5000/check_access/$src_addr/$tgt_addr")
    if [[ $? -ne 0 ]]; then
      print_warning "Failed to get access status for $src_name -> $tgt_name."
      return 1
    fi
    local granted
    granted=$(echo "$response" | jq -r '.access_granted')
    if [[ "$granted" == "true" ]]; then
      echo -e "${CYAN}  ${BOLD}ACCESS [✓]${NC} ${BOLD}$src_name -> $tgt_name${NC}: ${GREEN}ALLOWED${NC}"
      return 0
    else
      echo -e "${YELLOW}  ${BOLD}ACCESS [✗]${NC} ${BOLD}$src_name -> $tgt_name${NC}: ${RED}DENIED${NC}"
      return 1
    fi
  }
  # --- End of helper functions ---

  if check_blockchain_server_health; then
      # --- Define addresses ---
      SDN_AUTH_ADDR='0xC184836543aBd0B70ffb2A8083eEf57F829ACD62'
      CONTROLLER_ADDR='0x7F53d082A31c065493A119800AE9B680a752b5F9'
      S1_ADDR='0x1E9eb2b168993C1c4e79a4B1A7082a1BDA1D3234'
      S2_ADDR='0xac7c33305CaAB6e53955876374B97ED6203AD1D7'
      
      # --- Check Certificate of the Authority ---
      print_info "Verifying SDN Authority certificate..."
      check_certificate "$SDN_AUTH_ADDR" "SDN Authority"

      # --- Check Access Control ---
      print_info "Verifying access control rules..."
      check_access "$CONTROLLER_ADDR" "$S1_ADDR" "Controller" "s1"
      check_access "$S1_ADDR" "$CONTROLLER_ADDR" "s1" "Controller"
      check_access "$CONTROLLER_ADDR" "$S2_ADDR" "Controller" "s2"
      check_access "$S2_ADDR" "$CONTROLLER_ADDR" "s2" "Controller"
      check_access "$S1_ADDR" "$S2_ADDR" "s1" "s2"
      check_access "$S2_ADDR" "$S1_ADDR" "s2" "s1"
      print_success "Verification checks complete."
  else
      print_warning "Skipping certificate and access checks due to server issue."
  fi
fi


# ========== Mininet ==========
if ask_permission "Mininet with custom topology"; then
  print_header "Starting Mininet"
  
  print_info "Launching Mininet with topology: $TOPO_NAME"
  print_info "Remote controller: 127.0.0.1:$RYU_PORT"
  
  # Wait a bit for services to stabilize
  if [[ -n "$BLOCKCHAIN_PID" ]] || [[ -n "$RYU_PID" ]]; then
    print_info "Waiting 3 seconds for services to stabilize..."
    sleep 3
  fi
  
  # Launch Mininet
  if sudo mn --custom "$TOPO_FILE" \
            --topo "$TOPO_NAME" \
            --controller=remote,ip=127.0.0.1,port=$RYU_PORT \
            --switch ovsk,protocols=OpenFlow13; then
    print_success "Mininet terminated normally"
  else
    print_error "Error running Mininet"
  fi
else
  print_info "Mininet skipped by user"
fi

print_header "IoTA-SDN Script Complete"
print_info "All services have been processed"