import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SidebarProvider } from "@/components/ui/sidebar";
import { CertificateStatus, AccessStatusPair, NetworkTopology } from "@/types";
import {
  blockchainConfig
} from "@/services/blockchain";
import { createNetworkTopology, updateNetworkWithAccessStatus, getNetworkStatus, NetworkStatusResponse } from "@/services/network";
import { CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

import Header from "@/components/Header";
import StatusCard from "@/components/StatusCard";
import NetworkTopologyView from "@/components/NetworkTopologyView";
import CertificateCard from "@/components/CertificateCard";
import ContractInfo from "@/components/ContractInfo";
import AccessControlTable from "@/components/AccessControlTable";
import AddressDisplay from "@/components/AddressDisplay";
import DashboardSidebar from "@/components/DashboardSidebar";

const Index = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { token, isAuthenticated } = useAuth();

  // States for certificate and access control
  const [certificateOverallStatus, setCertificateOverallStatus] = useState<CertificateStatus>();
  const [controllerToSwitch, setControllerToSwitch] = useState<AccessStatusPair>();
  const [switchToSwitch, setSwitchToSwitch] = useState<AccessStatusPair>();
  const [controllerToController, setControllerToController] = useState<AccessStatusPair>();
  const [switch1ToController, setSwitch1ToController] = useState<AccessStatusPair>();
  const [switch2ToController, setSwitch2ToController] = useState<AccessStatusPair>();
  const [rpcStatus, setRpcStatus] = useState<{
    isConnected: boolean;
    lastBlock: number;
    endpoint: string;
  }>();
  const [contracts, setContracts] = useState<{
    authority: { address: string; isValid: boolean };
    accessControl: { address: string; isValid: boolean };
  }>();
  // New state for all granular access details for the table
  const [allAccessDetails, setAllAccessDetails] = useState<AccessStatusPair[]>([]);

  // Network topology state
  const [topology, setTopology] = useState<NetworkTopology>(createNetworkTopology());

  // Function to load all statuses
  const loadAllStatuses = async () => {
    if (isLoading) return;

    setIsLoading(true);
    toast({
      title: "Refreshing blockchain status",
      description: "Please wait while we fetch the latest data...",
    });

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error("No authentication token found.");
        toast({
          title: "Error",
          description: "Authentication token missing.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const data: NetworkStatusResponse = await getNetworkStatus(token);
      console.log("Network status data received:", data);
      console.log("Certificates summary details:", data.certificate_details);

      const areAllCertificatesValid = data.overall_certificates_valid;
      setCertificateOverallStatus({
        address: data.networkAddresses.controller1 || "N/A",
        isValid: areAllCertificatesValid,
      });
      setRpcStatus({
        isConnected: data.network_info.provider !== undefined,
        lastBlock: data.network_info.last_block,
        endpoint: data.network_info.provider,
      });

      // Handle missing contracts data
      const defaultContracts = {
        authority: { address: 'N/A', isValid: false },
        accessControl: { address: 'N/A', isValid: false }
      };

      setContracts({
        authority: {
          address: data.contracts?.authority?.address || defaultContracts.authority.address,
          isValid: !!data.contracts?.authority?.address && data.contracts.authority.address !== 'N/A'
        },
        accessControl: {
          address: data.contracts?.accessControl?.address || defaultContracts.accessControl.address,
          isValid: !!data.contracts?.accessControl?.address && data.contracts.accessControl.address !== 'N/A'
        }
      });

      // Find the specific access statuses from data.access_details
      const allControllerToSwitchAccesses = data.access_details.filter(
        (detail) => detail.source === data.networkAddresses.controller1 &&
          (detail.target === data.networkAddresses.switch1 || detail.target === data.networkAddresses.switch2)
      );
      // Correctly set overall status: true only if there are accesses and all are valid
      const overallControllerToSwitchStatus = allControllerToSwitchAccesses.length > 0 && allControllerToSwitchAccesses.every(detail => detail.status);
      setControllerToSwitch({
        source: data.networkAddresses.controller1,
        target: data.networkAddresses.switch1, // A logical grouping for display
        status: overallControllerToSwitchStatus
      });
      console.log("DEBUG Frontend: overallControllerToSwitchStatus", overallControllerToSwitchStatus); // Added debug log

      const switchToSwitchAccess = data.access_details.find(
        (detail) => detail.source === data.networkAddresses.switch1 && detail.target === data.networkAddresses.switch2
      );

      if (!switchToSwitchAccess && data.networkAddresses.switch1 && data.networkAddresses.switch2) {
        console.warn("Switch to switch access not found in access details, defaulting to false.");
      }
      setSwitchToSwitch({
        source: data.networkAddresses.switch1,
        target: data.networkAddresses.switch2,
        status: switchToSwitchAccess ? switchToSwitchAccess.status : false // Directly use status if found, else false
      });

      setControllerToController(undefined);

      const switch1Address = blockchainConfig.switch1;
      const switch2Address = blockchainConfig.switch2;
      const controller1Address = blockchainConfig.controller1;

      const switch1ToControllerAccess = data.access_details.find(
        (detail) => detail.source === switch1Address && detail.target === controller1Address
      );

      if (!switch1ToControllerAccess && switch1Address && controller1Address) {
        console.warn("Switch1 to controller access not found in access details, defaulting to false.");
      }
      setSwitch1ToController({
        source: switch1Address,
        target: controller1Address,
        status: switch1ToControllerAccess ? switch1ToControllerAccess.status : false // Directly use status if found, else false
      });

      const switch2ToControllerAccess = data.access_details.find(
        (detail) => detail.source === switch2Address && detail.target === controller1Address
      );

      if (!switch2ToControllerAccess && switch2Address && controller1Address) {
        console.warn("Switch2 to controller access not found in access details, defaulting to false.");
      }
      setSwitch2ToController({
        source: switch2Address,
        target: controller1Address,
        status: switch2ToControllerAccess ? switch2ToControllerAccess.status : false // Directly use status if found, else false
      });

      // Set all granular access details for the table
      setAllAccessDetails(data.access_details.filter((status): status is AccessStatusPair =>
        status.source !== 'N/A' && status.target !== 'N/A'
      ));

      // Update network topology with access statuses
      const updatedTopology = updateNetworkWithAccessStatus(topology, data.access_details);
      setTopology(updatedTopology);

      toast({
        title: "Status Updated",
        description: "Network status has been refreshed from the blockchain",
        variant: "default",
      });
    } catch (error) {
      console.error("Error loading statuses:", error);
      toast({
        title: "Error",
        description: "Failed to fetch status from blockchain",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load statuses on initial render
  useEffect(() => {
    console.log("Index useEffect: isAuthenticated=", isAuthenticated, "token=", token ? "(present)" : "(null)");
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to view network status.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    if (token) {
      loadAllStatuses();
      const interval = setInterval(loadAllStatuses, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [token, isAuthenticated]);

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background text-foreground flex w-full">
        <DashboardSidebar onRefresh={loadAllStatuses} isLoading={isLoading} />

        <div className="flex-1 flex flex-col">
          <Header onRefresh={loadAllStatuses} isLoading={isLoading} />

          <main className="flex-1 container mx-auto py-8 px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatusCard
                title="RPC Connection"
                description={`Connected to ${rpcStatus?.endpoint || 'N/A'}`}
                status={rpcStatus?.isConnected}
                loading={isLoading}
                details={rpcStatus ? `Last block: ${rpcStatus.lastBlock}` : undefined}
              />
              <ContractInfo
                contractName="Authority Contract"
                address={contracts?.authority.address}
                isValid={contracts?.authority.isValid}
                loading={isLoading}
              />
              <ContractInfo
                contractName="Access Control Contract"
                address={contracts?.accessControl.address}
                isValid={contracts?.accessControl.isValid}
                loading={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatusCard
                title="Certificate Validation Status"
                description="Validates node identity on the blockchain"
                status={certificateOverallStatus?.isValid}
                loading={isLoading}
              />
              <StatusCard
                title="Controller-Switch Access"
                description="Access permission between controllers and switches"
                status={controllerToSwitch?.status}
                loading={isLoading}
              />
              <StatusCard
                title="Switch1-Controller Access"
                description="Access permission between Switch 1 and controllers"
                status={controllerToSwitch?.status}
                loading={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatusCard
                title="Switch2-Controller Access"
                description="Access permission between Switch 2 and controllers"
                status={controllerToSwitch?.status}
                loading={isLoading}
              />
              <StatusCard
                title="Switch-Switch Access"
                description="Access permission between network switches"
                status={switchToSwitch?.status}
                loading={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2">
                <Card className="blockchain-card h-full flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold">Network Topology</CardTitle>
                    <CardDescription>
                      Visual representation of the network structure and connections
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow flex items-center justify-center p-0">
                    <NetworkTopologyView topology={topology} className="w-full h-full" />
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-1">
                <CertificateCard
                  certificate={certificateOverallStatus}
                  loading={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="blockchain-card h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Access Control Matrix</CardTitle>
                    <CardDescription>
                      Blockchain-verified access permissions between network components
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="table">
                      <TabsList className="mb-4">
                        <TabsTrigger value="table">Table View</TabsTrigger>
                        <TabsTrigger value="matrix">Matrix View</TabsTrigger>
                      </TabsList>
                      <TabsContent value="table">
                        <AccessControlTable
                          accessStatuses={allAccessDetails}
                        />
                      </TabsContent>
                      <TabsContent value="matrix">
                        <div className="p-4 rounded-lg border bg-card text-card-foreground">
                          <div className="text-center text-sm mb-4">Access Control Matrix</div>
                          <div className="grid grid-cols-4 gap-2">
                            <div className="font-mono text-xs bg-muted rounded p-2 text-center"></div>
                            <div className="font-mono text-xs bg-muted rounded p-2 text-center">Controller</div>
                            <div className="font-mono text-xs bg-muted rounded p-2 text-center">Switch</div>
                            <div className="font-mono text-xs bg-muted rounded p-2 text-center">Host</div>

                            <div className="font-mono text-xs bg-muted rounded p-2 text-center">Controller</div>
                            <div className="font-mono text-xs rounded p-2 text-center">
                              {controllerToController?.status ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500 inline-block" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-500 inline-block" />
                              )}
                            </div>
                            <div className="font-mono text-xs rounded p-2 text-center">
                              {controllerToSwitch?.status ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500 inline-block" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-500 inline-block" />
                              )}
                            </div>
                            <div className="font-mono text-xs rounded p-2 text-center">N/A</div>

                            <div className="font-mono text-xs bg-muted rounded p-2 text-center">Switch</div>
                            <div className="font-mono text-xs rounded p-2 text-center">N/A</div>
                            <div className="font-mono text-xs rounded p-2 text-center">
                              {switchToSwitch?.status ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500 inline-block" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-500 inline-block" />
                              )}
                            </div>
                            <div className="font-mono text-xs rounded p-2 text-center">
                              <CheckCircle2 className="h-5 w-5 text-green-500 inline-block" />
                            </div>

                            <div className="font-mono text-xs bg-muted rounded p-2 text-center">Host</div>
                            <div className="font-mono text-xs rounded p-2 text-center">N/A</div>
                            <div className="font-mono text-xs rounded p-2 text-center">N/A</div>
                            <div className="font-mono text-xs rounded p-2 text-center">N/A</div>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
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

export default Index;