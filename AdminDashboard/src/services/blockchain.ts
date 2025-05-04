
import { BlockchainConfig, CertificateStatus, AccessStatusPair } from '@/types';

// Mock configuration from Python code
export const blockchainConfig: BlockchainConfig = {
  myAddress: "0xC184836543aBd0B70ffb2A8083eEf57F829ACD62",
  privateKey: "7354d112f673e3dbc329479d91b8e97a6b77a327389dd946227a15360a67ccb6",
  authorityContractAddress: "0x8859CEA6f5F0DF05252D132F2f0bae5fF73Ed90F",
  accessControlContractAddress: "0x217f3c3C1859Ae5CF316679Ac3831ECAD97eee08",
  controller1: "0x7F53d082A31c065493A119800AE9B680a752b5F9",
  switch1: "0x1E9eb2b168993C1c4e79a4B1A7082a1BDA1D3234",
  switch2: "0x1E9eb2b168993C1c4e79a4B1A7082a1BDA1D3234",
  switch3: "0x5eE1BEdd2E19DebFdD62eA57BDD1AcF8bf36C58A",
  controller2: "0x52f68B8c1c11DF43eDF0b47ba20952FF5d299218",
  validCertificate: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  revokedCertificate: "0x45191aa30986B3207C42102787f14f896AFB5554",
  providerUrl: "https://json-rpc.evm.testnet.iotaledger.net/",
  authorityAbiFile: "abi/authority.json",
  accessControlAbiFile: "abi/AccessControl.json"
};

// This is a mock implementation that simulates blockchain calls
export async function checkCertificateValidity(address: string): Promise<CertificateStatus> {
  console.log(`Checking certificate validity for ${address}`);
  // Simulate blockchain call
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // For demo purposes, only the validCertificate address returns true
  const isValid = address === blockchainConfig.myAddress;
  
  return {
    address,
    isValid
  };
}

export async function checkAccessControllerToSwitch(): Promise<AccessStatusPair> {
  console.log('Checking access between controller and switch');
  // Simulate blockchain call
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return {
    source: blockchainConfig.controller1,
    target: blockchainConfig.switch1,
    status: true // For demo purposes, this is always valid
  };
}

export async function checkAccessSwitchToSwitch(): Promise<AccessStatusPair> {
  console.log('Checking access between switches');
  // Simulate blockchain call
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  return {
    source: blockchainConfig.switch1,
    target: blockchainConfig.switch2,
    status: true // For demo purposes, this is always valid
  };
}

export async function checkAccessControllerToController(): Promise<AccessStatusPair> {
  console.log('Checking access between controllers');
  // Simulate blockchain call
  await new Promise(resolve => setTimeout(resolve, 600));
  
  return {
    source: blockchainConfig.controller1,
    target: blockchainConfig.controller2,
    status: false // For demo purposes, set to false to show invalid access
  };
}

export async function getAllAccessStatuses(): Promise<AccessStatusPair[]> {
  const [cs, ss, cc] = await Promise.all([
    checkAccessControllerToSwitch(),
    checkAccessSwitchToSwitch(),
    checkAccessControllerToController()
  ]);
  
  return [cs, ss, cc];
}
