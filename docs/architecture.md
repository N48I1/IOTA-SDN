# IOTA-SDN Architecture

## System Overview

The IOTA-SDN system combines Software-Defined Networking with blockchain-based access control using IOTA 2.0. The system consists of four main components:

1. Blockchain Layer
2. SDN Controller
3. API Server
4. Network Infrastructure

## Component Details

### 1. Blockchain Layer

#### Smart Contracts
- **AccessControl**: Manages network access permissions between devices
- **Authority**: Handles device certificates and role management

#### Key Features
- Certificate-based device authentication
- Role-based access control
- Permission management for network flows

### 2. SDN Controller

#### RYU Controller
- Custom implementation based on RYU framework
- OpenFlow protocol support
- Flow rule management

#### Key Features
- Dynamic flow rule installation
- Access control enforcement
- Network monitoring

### 3. API Server

#### Flask API
- RESTful endpoints for system management
- Blockchain interaction
- Network status monitoring

#### Key Endpoints
- `/health`: System health check
- `/check_certificate/{address}`: Certificate verification
- `/check_access/{source}/{target}`: Access control verification
- `/check_all`: Overall system status

### 4. Network Infrastructure

#### Mininet Network
- Custom topology with multiple switches
- Host devices for testing
- Network emulation
- Main network configuration in `src/network/main.py`

#### Key Features
- Programmable network topology
- Traffic generation capabilities
- Network isolation

## Communication Flow

1. **Device Authentication**
   - Device requests access
   - Controller verifies certificate
   - Authority contract validates role

2. **Access Control**
   - Controller checks permissions
   - AccessControl contract verifies rules
   - Flow rules are installed if allowed

3. **Network Monitoring**
   - Controller monitors traffic
   - API server provides status updates
   - Blockchain records access events

## Security Considerations

1. **Certificate Management**
   - Secure certificate storage
   - Regular certificate validation
   - Role-based access control

2. **Network Security**
   - Flow rule validation
   - Traffic monitoring
   - Access control enforcement

3. **Blockchain Security**
   - Smart contract security
   - Transaction validation
   - Permission management 