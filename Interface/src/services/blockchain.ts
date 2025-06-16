import { BlockchainConfig, CertificateStatus, AccessStatusPair, NetworkStatusResponse } from '@/types';

// Updated BlockchainConfig - only include necessary frontend-specific info if any, otherwise remove.
// Since the backend will handle all contract interactions, this might become just an empty object or hold user-specific address.
export const blockchainConfig: BlockchainConfig = {
  // Adding static controller and switch addresses to match backend config.py
  controller1: '0x94F6D50D4a103046F2ad1Dc05278c0b96Cb83bFF',
  controller2: '0xC95449F9a0eDf900E7a91B43eA982aF6cE7C411B',
  switch1: '0x1e8ca3b2af6209b92e9181ec689447c9ec032ae3',
  switch2: '0xde84b29a82e908f812ce153748d30aaae10713de',
  switch3: '0x5678901234567890123456789012345678901234',
};

export async function fetchBlockchainStatus(): Promise<NetworkStatusResponse> {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found.');
  }

  const response = await fetch('http://192.168.1.8:5000/api/network/status', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch blockchain status from backend.');
  }

  return response.json();
}
