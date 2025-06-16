import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getNetworkStatus, NetworkStatusResponse, AccessDetail } from "@/services/network";
import { useAuth } from "@/contexts/AuthContext";
import { RefreshCw } from "lucide-react";
import { blockchainConfig } from '@/services/blockchain';

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

    // Helper function to shorten address
    const shortenAddress = (address: string) => {
        if (!address || address === 'N/A') return 'N/A';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    // Helper to get human-readable name for an address
    const getEntityName = (address: string) => {
        if (address === status.networkAddresses.controller1) return "Controller 1";
        if (address === status.networkAddresses.switch1) return "Switch 1";
        if (address === status.networkAddresses.switch2) return "Switch 2";
        return shortenAddress(address); // Fallback to shortened address if not a known entity
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
        console.log("AuthorityStatus useEffect triggered. Token:", token, "IsAuthenticated:", isAuthenticated);
        if (!isAuthenticated) {
            setError("Vous devez être authentifié pour voir l'état du réseau.");
            setLoading(false);
            return;
        }
        if (token) {
            fetchNetworkStatus();
            const interval = setInterval(fetchNetworkStatus, 10000);
            return () => clearInterval(interval);
        } else {
            setError("Token d'authentification manquant malgré l'authentification.");
            setLoading(false);
        }
    }, [token, isAuthenticated]);

    if (!isAuthenticated) {
        return (
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-6">État du Réseau et Contrôle d'Accès</h1>
                <Alert>
                    <AlertDescription>
                        Vous devez être connecté pour voir l'état du réseau.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="container mx-auto p-4 flex justify-center items-center h-screen">
                <p>Chargement des statuts du réseau...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto p-4">
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">État du Réseau et Contrôle d'Accès</h1>

            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 mb-6">
                <Card>
                    <CardHeader>
                        <CardTitle>RPC Connection</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500">Connected to: {status.rpcConnected ? status.network_info.provider : 'N/A'}</p>
                        <Badge variant={status.rpcConnected ? "success" : "destructive"}>
                            {status.rpcConnected ? "Valid" : "Invalid"}
                        </Badge>
                        <p className="text-sm text-gray-500 mt-2">Last block: {status.lastBlock}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Authority Contract</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500 truncate" title={status.authorityContractAddress}>Address: {shortenAddress(status.authorityContractAddress)}</p>
                        <Badge variant={status.authorityContractValid ? "success" : "destructive"}>
                            {status.authorityContractValid ? "Valid" : "Invalid"}
                        </Badge>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Access Control Contract</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500 truncate" title={status.accessControlContractAddress}>Address: {shortenAddress(status.accessControlContractAddress)}</p>
                        <Badge variant={status.accessControlContractValid ? "success" : "destructive"}>
                            {status.accessControlContractValid ? "Valid" : "Invalid"}
                        </Badge>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Certificate Validation</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Badge variant={status.certificateValidationOverall ? "success" : "destructive"}>
                            {status.certificateValidationOverall ? "Valid" : "Invalid"}
                        </Badge>
                        <div className="mt-2">
                            {status.certificateDetails.map((cert, index) => (
                                <p key={index} className="text-sm text-gray-500">
                                    {cert.entity} {shortenAddress(cert.address)}: {cert.isValid ? "Valid" : "Invalid"}
                                </p>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">Access Control Matrix</h2>
                <Card>
                    <CardHeader>
                        <CardTitle>Specific Access Relationships</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {status.accessDetails.map((detail, index) => (
                                    <tr key={index}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 truncate" title={detail.source}>{getEntityName(detail.source)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 truncate" title={detail.target}>{getEntityName(detail.target)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Badge variant={detail.status ? "success" : "destructive"}>
                                                {detail.status ? "OK" : "REFUSÉ"}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            </div>

            <Button onClick={fetchNetworkStatus} className="mt-4">
                <RefreshCw className="mr-2 h-4 w-4" /> Actualiser
            </Button>
        </div>
    );
};

export default AuthorityStatus; 