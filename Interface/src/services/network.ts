import { NetworkTopology, NetworkNode, NetworkLink } from '@/types';
import { blockchainConfig } from './blockchain';

// Creates a mock network topology for visualization based on the Python code
export function createNetworkTopology(networkAddresses?: {
  controller1?: string;
  switch1?: string;
  switch2?: string;
}): NetworkTopology {
  const nodes: NetworkNode[] = [
    {
      id: 'c0',
      type: 'controller',
      label: 'Controller (c0)',
      ip: networkAddresses?.controller1 || '127.0.0.1',
      x: 400,
      y: 100
    },
    {
      id: 's0',
      type: 'switch',
      label: 'Switch (s0)',
      ip: networkAddresses?.switch1,
      x: 300,
      y: 250
    },
    {
      id: 's1',
      type: 'switch',
      label: 'Switch (s1)',
      ip: networkAddresses?.switch2,
      x: 500,
      y: 250
    },
    {
      id: 'h0',
      type: 'host',
      label: 'Host (h0)',
      ip: '192.168.1.1/24',
      x: 200,
      y: 350
    },
    {
      id: 'h1',
      type: 'host',
      label: 'Host (h1)',
      ip: '192.168.1.2/24',
      x: 300,
      y: 350
    },
    {
      id: 'h2',
      type: 'host',
      label: 'Host (h2)',
      ip: '192.168.1.3/24',
      x: 500,
      y: 350
    },
    {
      id: 'h3',
      type: 'host',
      label: 'Host (h3)',
      ip: '192.168.1.4/24',
      x: 600,
      y: 350
    }
  ];

  const links: NetworkLink[] = [
    { source: 'c0', target: 's0' },
    { source: 'c0', target: 's1' },
    { source: 's0', target: 's1' },
    { source: 's0', target: 'h0' },
    { source: 's0', target: 'h1' },
    { source: 's1', target: 'h2' },
    { source: 's1', target: 'h3' }
  ];

  return { nodes, links };
}

// Map node IDs to blockchain addresses for access control visualization
export const nodeAddressMapping = {
  'c0': blockchainConfig.controller1,
  'c1': blockchainConfig.controller2,
  's0': blockchainConfig.switch1,
  's1': blockchainConfig.switch2,
  's2': blockchainConfig.switch3
};

// Updates network links with access control status
export function updateNetworkWithAccessStatus(
  network: NetworkTopology,
  accessStatuses: { source: string; target: string; status: boolean }[]
): NetworkTopology {
  const updatedLinks = network.links.map(link => {
    // Find if there's an access status for this link
    const accessStatus = accessStatuses.find(status => {
      const sourceAddress = nodeAddressMapping[link.source as keyof typeof nodeAddressMapping];
      const targetAddress = nodeAddressMapping[link.target as keyof typeof nodeAddressMapping];

      return (
        (status.source === sourceAddress && status.target === targetAddress) ||
        (status.source === targetAddress && status.target === sourceAddress)
      );
    });

    if (accessStatus) {
      return { ...link, status: accessStatus.status };
    }

    return link;
  });

  return {
    ...network,
    links: updatedLinks
  };
}

export interface AccessDetail {
  source: string;
  target: string;
  status: boolean;
}

// Defines the expected structure of the network status API response
export interface NetworkStatusResponse {
  overall_certificates_valid: boolean;
  certificate_details: Array<{ entity: string; address: string; isValid: boolean }>;
  overall_access_valid: boolean;
  access_details: AccessDetail[];
  networkAddresses: {
    controller1: string;
    switch1: string;
    switch2: string;
  };
  network_info: {
    provider: string;
    last_block: number;
  };
  contracts: {
    authority: { address: string; isValid: boolean };
    accessControl: { address: string; isValid: boolean };
  };
}

// Fetches the comprehensive network status from the backend API
export async function getNetworkStatus(token: string): Promise<NetworkStatusResponse> {
  console.log("Token being sent to getNetworkStatus:", token);
  const response = await fetch('/api/network/status', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`HTTP error! status: ${response.status}, response: ${errorText}`);
    throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
  }

  const data = await response.json();
  console.log("Raw network status data received:", data);
  return data;
}
