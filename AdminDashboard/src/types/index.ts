
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
  myAddress: string;
  privateKey: string;
  authorityContractAddress: string;
  accessControlContractAddress: string;
  controller1: string;
  switch1: string;
  switch2: string;
  switch3: string;
  controller2: string;
  validCertificate: string;
  revokedCertificate: string;
  providerUrl: string;
  authorityAbiFile: string;
  accessControlAbiFile: string;
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
