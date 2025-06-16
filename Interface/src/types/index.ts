export interface NodeAddress {
  address: string;
  label: string;
  type: 'controller' | 'switch' | 'host';
}

export interface AccessStatusPair {
  source: string;
  target: string;
  status: boolean;
}

export interface CertificateStatus {
  address: string;
  isValid: boolean;
}

export interface BlockchainConfig {
  myAddress?: string;
  providerUrl?: string;
  controller1?: string;
  controller2?: string;
  switch1?: string;
  switch2?: string;
  switch3?: string;
}

export interface NetworkNode {
  id: string;
  type: 'controller' | 'switch' | 'host';
  ip?: string;
  label: string;
  x: number;
  y: number;
}

export interface NetworkLink {
  source: string;
  target: string;
  status?: boolean;
}

export interface NetworkTopology {
  nodes: NetworkNode[];
  links: NetworkLink[];
}

export interface CertificatesSummary {
  overall_valid: boolean;
  details: CertificateStatus[];
}

export interface AccessSummary {
  controller_to_switch_overall_valid: boolean;
  controller_to_switch_details: AccessStatusPair[];
  switch_to_controller_overall_valid: boolean;
  switch_to_controller_details: AccessStatusPair[];
  switch_to_switch_overall_valid: boolean;
  switch_to_switch_details: AccessStatusPair[];
}

export interface NetworkStatusResponse {
  network_info: {
    provider: string;
    last_block: number;
    controller1: string;
    controller2: string;
    switch1: string;
    switch2: string;
    switch3: string;
  };
  contracts: {
    authority: {
      address: string;
      isValid: boolean;
    };
    accessControl: {
      address: string;
      isValid: boolean;
    };
  };
  certificate_details: CertificateStatus[];
  overall_certificates_valid: boolean;
  access_details: AccessStatusPair[];
  overall_access_valid: boolean;
  networkAddresses: {
    controller1: string;
    switch1: string;
    switch2: string;
  };
}
