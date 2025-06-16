import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea"; // For publicKey if needed
import { getNetworkStatus, NetworkStatusResponse, AccessDetail } from "@/services/network";
import { useAuth } from "@/contexts/AuthContext";
import { RefreshCw } from "lucide-react";
import { blockchainConfig } from '@/services/blockchain';
import DashboardSidebar from "@/components/DashboardSidebar";
import Header from "@/components/Header";
import { SidebarProvider } from "@/components/ui/sidebar";
import StatusCard from "@/components/StatusCard";
import ContractInfo from "@/components/ContractInfo";
import AddressDisplay from "@/components/AddressDisplay";

interface DisplayStatus {
    rpcConnected: boolean;
    lastBlock: number;
    authorityContractAddress: string;
    authorityContractValid: boolean;
    accessControlContractAddress: string;
    accessControlContractValid: boolean;
    certificateValidationOverall: boolean;
    certificateDetails: Array<{ entity: string; address: string; isValid: boolean }>;
    overallAccessValid: boolean;
    accessDetails: AccessDetail[];
    networkAddresses: {
        controller1: string;
        switch1: string;
        switch2: string;
    };
    network_info: {
        provider: string;
        last_block: number;
    };
}

const AuthorityStatus: React.FC = () => {
    const { token, isAuthenticated } = useAuth();

    const [status, setStatus] = useState<DisplayStatus>({
        rpcConnected: false,
        lastBlock: 0,
        authorityContractAddress: 'N/A',
        authorityContractValid: false,
        accessControlContractAddress: 'N/A',
        accessControlContractValid: false,
        certificateValidationOverall: false,
        certificateDetails: [],
        overallAccessValid: false,
        accessDetails: [],
        networkAddresses: {
            controller1: 'N/A',
            switch1: 'N/A',
            switch2: 'N/A',
        },
        network_info: {
            provider: 'N/A',
            last_block: 0,
        },
    });
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // State for Authority contract interactions
    const [selectedAuthorityOperation, setSelectedAuthorityOperation] = useState<string>('');
    const [authorityOperationParams, setAuthorityOperationParams] = useState<Record<string, string>>({});
    const [authorityOperationResult, setAuthorityOperationResult] = useState<string | null>(null);
    const [isAuthorityOperationLoading, setIsAuthorityOperationLoading] = useState<boolean>(false);
    const [authorityOperationError, setAuthorityOperationError] = useState<string | null>(null);

    // Helper function to shorten address
    const shortenAddress = (address: string) => {
        if (!address || address === 'N/A') return 'N/A';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    // Helper to get human-readable name for an address
    const getEntityName = (address: string) => {
        if (!address || address === 'N/A') return 'N/A';
        if (address === status.networkAddresses.controller1) return "Controller 1";
        if (address === status.networkAddresses.switch1) return "Switch 1";
        if (address === status.networkAddresses.switch2) return "Switch 2";
        return shortenAddress(address); // Fallback to shortened address if not a known entity
    };

    const handleAuthorityOperation = async () => {
        setIsAuthorityOperationLoading(true);
        setAuthorityOperationResult(null);
        setAuthorityOperationError(null);

        if (!token) {
            setAuthorityOperationError("Authentication token missing.");
            setIsAuthorityOperationLoading(false);
            return;
        }

        let url = '';
        let method = 'POST';
        let body: Record<string, any> = {};

        try {
            switch (selectedAuthorityOperation) {
                case 'RegisterCert':
                    url = '/api/contract/authority/register_cert';
                    body = {
                        ISPs: authorityOperationParams.ISPs,
                        publicKey: authorityOperationParams.publicKey,
                        expiry: parseInt(authorityOperationParams.expiry) // Convert to number
                    };
                    break;
                case 'revoke':
                    url = '/api/contract/authority/revoke_cert';
                    body = { ISPs: authorityOperationParams.ISPs };
                    break;
                case 'transferOwnership':
                    url = '/api/contract/authority/transfer_ownership';
                    body = { newOwnerAddress: authorityOperationParams.newOwner };
                    const privateKey = prompt("Enter your private key to sign the transaction:");
                    if (!privateKey) {
                        throw new Error("Private key is required for this operation.");
                    }
                    body.privateKey = privateKey;
                    break;
                case 'isCertificateValid':
                    url = `/api/contract/authority/is_valid_cert?ISPs=${authorityOperationParams.ISPs}`;
                    method = 'GET';
                    break;
                case 'cert_revo_list':
                    url = '/api/contract/authority/cert_revo_list';
                    method = 'GET';
                    break;
                case 'isValid':
                    url = '/api/contract/authority/is_valid';
                    method = 'GET';
                    break;
                default:
                    setAuthorityOperationError("Please select a valid operation.");
                    setIsAuthorityOperationLoading(false);
                    return;
            }

            const fetchOptions: RequestInit = {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            };

            if (method === 'POST') {
                fetchOptions.body = JSON.stringify(body);
            }

            const response = await fetch(url, fetchOptions);
            const data = await response.json();

            if (response.ok) {
                setAuthorityOperationResult(JSON.stringify(data, null, 2));
            } else {
                setAuthorityOperationError(data.message || "Operation failed.");
            }

        } catch (err: any) {
            console.error("Error executing authority operation:", err);
            setAuthorityOperationError(err.message || "An unexpected error occurred.");
        } finally {
            setIsAuthorityOperationLoading(false);
        }
    };

    const fetchNetworkStatus = async () => {
        console.log("Attempting to fetch network status...");
        if (!token) {
            setError("Authentification requise. Veuillez vous connecter.");
            setLoading(false);
            console.log("No token found, skipping fetch.");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            console.log("Fetching with token:", token);
            const data: NetworkStatusResponse = await getNetworkStatus(token);

            // Filter and reorder access details as requested
            const filteredAccessDetails: AccessDetail[] = [];
            const controller1 = data.networkAddresses.controller1;
            const switch1 = data.networkAddresses.switch1;
            const switch2 = data.networkAddresses.switch2;

            // Find and add Controller 1 - Switch 1
            const cs1 = data.access_details.find(d =>
                (d.source === controller1 && d.target === switch1) ||
                (d.source === switch1 && d.target === controller1)
            );
            if (cs1) filteredAccessDetails.push({ source: controller1, target: switch1, status: cs1.status });

            // Find and add Controller 1 - Switch 2
            const cs2 = data.access_details.find(d =>
                (d.source === controller1 && d.target === switch2) ||
                (d.source === switch2 && d.target === controller1)
            );
            if (cs2) filteredAccessDetails.push({ source: controller1, target: switch2, status: cs2.status });

            // Find and add Switch 1 - Switch 2
            const ss = data.access_details.find(d =>
                (d.source === switch1 && d.target === switch2) ||
                (d.source === switch2 && d.target === switch1)
            );
            if (ss) filteredAccessDetails.push({ source: switch1, target: switch2, status: ss.status });

            setStatus({
                rpcConnected: data.network_info.provider !== undefined,
                lastBlock: data.network_info.last_block,
                authorityContractAddress: data.contracts?.authority?.address || 'N/A',
                authorityContractValid: data.contracts?.authority?.isValid || false,
                accessControlContractAddress: data.contracts?.accessControl?.address || 'N/A',
                accessControlContractValid: data.contracts?.accessControl?.isValid || false,
                certificateValidationOverall: data.overall_certificates_valid,
                certificateDetails: data.certificate_details,
                overallAccessValid: data.overall_access_valid,
                accessDetails: filteredAccessDetails, // Use filtered and reordered data
                networkAddresses: data.networkAddresses,
                network_info: data.network_info,
            });
            console.log("Network status fetched successfully:", data);
        } catch (err) {
            console.error('Error fetching network status:', err);
            setError("Échec de la récupération de l'état du réseau. Veuillez réessayer.");
            setStatus({
                rpcConnected: false,
                lastBlock: 0,
                authorityContractAddress: 'N/A',
                authorityContractValid: false,
                accessControlContractAddress: 'N/A',
                accessControlContractValid: false,
                certificateValidationOverall: false,
                certificateDetails: [],
                overallAccessValid: false,
                accessDetails: [],
                networkAddresses: {
                    controller1: 'N/A',
                    switch1: 'N/A',
                    switch2: 'N/A',
                },
                network_info: {
                    provider: 'N/A',
                    last_block: 0,
                },
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated && token) {
            fetchNetworkStatus();
            const interval = setInterval(fetchNetworkStatus, 30000); // Refresh every 30 seconds
            return () => clearInterval(interval);
        }
    }, [token, isAuthenticated]);

    return (
        <SidebarProvider>
            <div className="min-h-screen bg-background text-foreground flex w-full">
                <DashboardSidebar onRefresh={fetchNetworkStatus} isLoading={loading} />

                <div className="flex-1 flex flex-col">
                    <Header onRefresh={fetchNetworkStatus} isLoading={loading} />

                    <main className="flex-1 container mx-auto py-8 px-4">
                        <div className="space-y-8">
                            <Card className="p-6 shadow-lg rounded-lg">
                                <CardHeader>
                                    <CardTitle className="text-2xl font-bold text-primary">Authority Contract Operations</CardTitle>
                                    <p className="text-muted-foreground">Interact with the Authority smart contract functions.</p>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <Label htmlFor="operation-select" className="mb-2 block">Select Operation</Label>
                                            <Select value={selectedAuthorityOperation} onValueChange={setSelectedAuthorityOperation}>
                                                <SelectTrigger id="operation-select" className="w-full">
                                                    <SelectValue placeholder="Choose an operation" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="RegisterCert">RegisterCert(address ISPs, bytes32 publicKey, uint expiry)</SelectItem>
                                                    <SelectItem value="revoke">revoke(address ISPs)</SelectItem>
                                                    <SelectItem value="isCertificateValid">isCertificateValid(address ISPs)</SelectItem>
                                                    <SelectItem value="cert_revo_list">cert_revo_list()</SelectItem>
                                                    <SelectItem value="isValid">isValid()</SelectItem>
                                                </SelectContent>
                                            </Select>

                                            {selectedAuthorityOperation === 'transferOwnership' && (
                                                <div className="mt-4">
                                                    <Label htmlFor="newOwnerAddress" className="mb-2 block">New Owner Address</Label>
                                                    <Input
                                                        id="newOwnerAddress"
                                                        value={authorityOperationParams.newOwner || ''}
                                                        onChange={(e) => setAuthorityOperationParams({ ...authorityOperationParams, newOwner: e.target.value })}
                                                        placeholder="Enter new owner Ethereum address"
                                                    />
                                                </div>
                                            )}
                                            {selectedAuthorityOperation === 'isCertificateValid' && (
                                                <div className="mt-4">
                                                    <Label htmlFor="ispsAddress" className="mb-2 block">ISPs Address</Label>
                                                    <Input
                                                        id="ispsAddress"
                                                        value={authorityOperationParams.ISPs || ''}
                                                        onChange={(e) => setAuthorityOperationParams({ ...authorityOperationParams, ISPs: e.target.value })}
                                                        placeholder="Enter ISPs Ethereum address"
                                                    />
                                                </div>
                                            )}
                                            {selectedAuthorityOperation === 'RegisterCert' && (
                                                <div className="mt-4 space-y-4">
                                                    <div>
                                                        <Label htmlFor="registerISPs" className="mb-2 block">ISPs Address</Label>
                                                        <Input
                                                            id="registerISPs"
                                                            value={authorityOperationParams.ISPs || ''}
                                                            onChange={(e) => setAuthorityOperationParams({ ...authorityOperationParams, ISPs: e.target.value })}
                                                            placeholder="Enter ISPs Ethereum address"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="publicKey" className="mb-2 block">Public Key (Base64 Encoded)</Label>
                                                        <Textarea
                                                            id="publicKey"
                                                            value={authorityOperationParams.publicKey || ''}
                                                            onChange={(e) => setAuthorityOperationParams({ ...authorityOperationParams, publicKey: e.target.value })}
                                                            placeholder="Enter Base64 encoded public key"
                                                            rows={4}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="expiry" className="mb-2 block">Expiry (Unix Timestamp in seconds)</Label>
                                                        <Input
                                                            id="expiry"
                                                            type="number"
                                                            value={authorityOperationParams.expiry || ''}
                                                            onChange={(e) => setAuthorityOperationParams({ ...authorityOperationParams, expiry: e.target.value })}
                                                            placeholder="e.g., 1678886400"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            {selectedAuthorityOperation === 'revoke' && (
                                                <div className="mt-4">
                                                    <Label htmlFor="revokeISPs" className="mb-2 block">ISPs Address to Revoke</Label>
                                                    <Input
                                                        id="revokeISPs"
                                                        value={authorityOperationParams.ISPs || ''}
                                                        onChange={(e) => setAuthorityOperationParams({ ...authorityOperationParams, ISPs: e.target.value })}
                                                        placeholder="Enter ISPs Ethereum address to revoke"
                                                    />
                                                </div>
                                            )}

                                            <Button onClick={handleAuthorityOperation} className="mt-6 w-full" disabled={isAuthorityOperationLoading}>
                                                {isAuthorityOperationLoading ? (
                                                    <>
                                                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                                        Executing...
                                                    </>
                                                ) : (
                                                    "Execute Operation"
                                                )}
                                            </Button>

                                            {authorityOperationError && (
                                                <Alert variant="destructive" className="mt-4">
                                                    <AlertDescription>{authorityOperationError}</AlertDescription>
                                                </Alert>
                                            )}
                                            {authorityOperationResult && (
                                                <Alert className="mt-4">
                                                    <AlertDescription>
                                                        <h4 className="font-medium">Operation Result:</h4>
                                                        <pre className="mt-2 whitespace-pre-wrap text-sm border p-2 rounded bg-muted">
                                                            {authorityOperationResult}
                                                        </pre>
                                                    </AlertDescription>
                                                </Alert>
                                            )}
                                        </div>

                                        <div className="border-l pl-6">
                                            <h3 className="text-xl font-semibold mb-4">Current Authority Status</h3>
                                            <div className="space-y-3 text-sm">
                                                <div>
                                                    <span className="font-medium">RPC Connection:</span>{" "}
                                                    <Badge variant={status.rpcConnected ? "default" : "destructive"}>
                                                        {status.rpcConnected ? "Connected" : "Disconnected"}
                                                    </Badge>
                                                </div>
                                                <div>
                                                    <span className="font-medium">Last Block:</span> {status.lastBlock}
                                                </div>
                                                <div>
                                                    <span className="font-medium">Authority Contract:</span>{" "}
                                                    {shortenAddress(status.authorityContractAddress)}{" "}
                                                    <Badge variant={status.authorityContractValid ? "default" : "destructive"}>
                                                        {status.authorityContractValid ? "Valid" : "Invalid/Not Deployed"}
                                                    </Badge>
                                                </div>
                                                <div>
                                                    <span className="font-medium">Access Control Contract:</span>{" "}
                                                    {shortenAddress(status.accessControlContractAddress)}{" "}
                                                    <Badge variant={status.accessControlContractValid ? "default" : "destructive"}>
                                                        {status.accessControlContractValid ? "Valid" : "Invalid/Not Deployed"}
                                                    </Badge>
                                                </div>
                                                <div>
                                                    <span className="font-medium">Overall Certificate Validation:</span>{" "}
                                                    <Badge variant={status.certificateValidationOverall ? "default" : "destructive"}>
                                                        {status.certificateValidationOverall ? "Valid" : "Invalid"}
                                                    </Badge>
                                                </div>
                                                <div>
                                                    <span className="font-medium">Overall Access Validation:</span>{" "}
                                                    <Badge variant={status.overallAccessValid ? "default" : "destructive"}>
                                                        {status.overallAccessValid ? "Valid" : "Invalid"}
                                                    </Badge>
                                                </div>
                                            </div>

                                            <h4 className="text-lg font-semibold mt-6 mb-3">Network Addresses:</h4>
                                            <ul className="list-disc pl-5 space-y-1 text-sm">
                                                <li><span className="font-medium">Controller 1:</span> {shortenAddress(status.networkAddresses.controller1)}</li>
                                                <li><span className="font-medium">Switch 1:</span> {shortenAddress(status.networkAddresses.switch1)}</li>
                                                <li><span className="font-medium">Switch 2:</span> {shortenAddress(status.networkAddresses.switch2)}</li>
                                            </ul>

                                            <h4 className="text-lg font-semibold mt-6 mb-3">Certificate Details:</h4>
                                            {status.certificateDetails.length > 0 ? (
                                                <ul className="space-y-2 text-sm">
                                                    {status.certificateDetails.map((cert, index) => (
                                                        <li key={index} className="flex items-center justify-between p-2 border rounded-md">
                                                            <span>{getEntityName(cert.address)} ({shortenAddress(cert.address)})</span>
                                                            <Badge variant={cert.isValid ? "default" : "destructive"}>
                                                                {cert.isValid ? "Valid" : "Invalid"}
                                                            </Badge>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-muted-foreground text-sm">No certificate details available.</p>
                                            )}

                                            <h4 className="text-lg font-semibold mt-6 mb-3">Access Details:</h4>
                                            {status.accessDetails.length > 0 ? (
                                                <ul className="space-y-2 text-sm">
                                                    {status.accessDetails.map((access, index) => (
                                                        <li key={index} className="flex items-center justify-between p-2 border rounded-md">
                                                            <span>{getEntityName(access.source)} &#8594; {getEntityName(access.target)}</span>
                                                            <Badge variant={access.status ? "default" : "destructive"}>
                                                                {access.status ? "Allowed" : "Denied"}
                                                            </Badge>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-muted-foreground text-sm">No access details available.</p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <StatusCard
                                    title="RPC Connection"
                                    description={`Connected to ${status?.network_info.provider || 'N/A'}`}
                                    status={status?.rpcConnected}
                                    loading={loading}
                                    details={status ? `Last block: ${status.lastBlock}` : undefined}
                                />
                                <ContractInfo
                                    contractName="Authority Contract"
                                    address={status?.authorityContractAddress}
                                    isValid={status?.authorityContractValid}
                                    loading={loading}
                                />
                                <ContractInfo
                                    contractName="Access Control Contract"
                                    address={status?.accessControlContractAddress}
                                    isValid={status?.accessControlContractValid}
                                    loading={loading}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <StatusCard
                                    title="Certificate Validation Status"
                                    description="Validates node identity on the blockchain"
                                    status={status?.certificateValidationOverall}
                                    loading={loading}
                                />
                                <StatusCard
                                    title="Overall Access Validation"
                                    description="Overall status of access control permissions"
                                    status={status?.overallAccessValid}
                                    loading={loading}
                                />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card className="blockchain-card h-full">
                                    <CardHeader>
                                        <CardTitle className="text-xl font-semibold">Certificate Details</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {status.certificateDetails.length > 0 ? (
                                            <ul className="space-y-2 text-sm">
                                                {status.certificateDetails.map((cert, index) => (
                                                    <li key={index} className="flex items-center justify-between p-2 border rounded-md">
                                                        <span>{getEntityName(cert.address)} ({shortenAddress(cert.address)})</span>
                                                        <Badge variant={cert.isValid ? "default" : "destructive"}>
                                                            {cert.isValid ? "Valid" : "Invalid"}
                                                        </Badge>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-muted-foreground text-sm">No certificate details available.</p>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card className="blockchain-card h-full">
                                    <CardHeader>
                                        <CardTitle className="text-xl font-semibold">Access Details</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {status.accessDetails.length > 0 ? (
                                            <ul className="space-y-2 text-sm">
                                                {status.accessDetails.map((access, index) => (
                                                    <li key={index} className="flex items-center justify-between p-2 border rounded-md">
                                                        <span>{getEntityName(access.source)} &#8594; {getEntityName(access.target)}</span>
                                                        <Badge variant={access.status ? "default" : "destructive"}>
                                                            {access.status ? "Allowed" : "Denied"}
                                                        </Badge>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-muted-foreground text-sm">No access details available.</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </main>

                    <footer className="py-6 border-t border-border bg-card mt-8">
                        <div className="container mx-auto px-4">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="text-sm text-muted-foreground">
                                    IOTASDN
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">Connected to:</span>
                                    <AddressDisplay
                                        address={blockchainConfig.providerUrl}
                                        truncate={false}
                                        className="text-xs"
                                    />
                                </div>
                            </div>
                        </div>
                    </footer>
                </div>
            </div>
        </SidebarProvider>
    );
};

export default AuthorityStatus; 