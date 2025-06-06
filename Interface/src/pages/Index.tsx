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
  checkCertificateValidity, 
  getAllAccessStatuses,
  blockchainConfig
} from "@/services/blockchain";
import { createNetworkTopology, updateNetworkWithAccessStatus } from "@/services/network";
import { CheckCircle2, XCircle } from "lucide-react";

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
  
  // States for certificate and access control
  const [certificateStatus, setCertificateStatus] = useState<CertificateStatus>();
  const [controllerToSwitch, setControllerToSwitch] = useState<AccessStatusPair>();
  const [switchToSwitch, setSwitchToSwitch] = useState<AccessStatusPair>();
  const [controllerToController, setControllerToController] = useState<AccessStatusPair>();
  
  // Network topology state
  const [topology, setTopology] = useState<NetworkTopology>(createNetworkTopology());
  
  // Function to load all statuses
  const loadAllStatuses = async () => {
    if (isLoading) return; // Prevent multiple simultaneous refreshes
    
    setIsLoading(true);
    toast({
      title: "Refreshing blockchain status",
      description: "Please wait while we fetch the latest data...",
    });
    
    try {
      // Check certificate validity
      const cert = await checkCertificateValidity(blockchainConfig.myAddress);
      setCertificateStatus(cert);
      
      // Check all access control statuses
      const accessStatuses = await getAllAccessStatuses();
      
      setControllerToSwitch(accessStatuses[0]);
      setSwitchToSwitch(accessStatuses[1]);
      setControllerToController(accessStatuses[2]);
      
      // Update network topology with access statuses
      const updatedTopology = updateNetworkWithAccessStatus(topology, accessStatuses);
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
    loadAllStatuses();
  }, []);
  
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background text-foreground flex w-full">
        <DashboardSidebar onRefresh={loadAllStatuses} isLoading={isLoading} />
        
        <div className="flex-1 flex flex-col">
          <Header onRefresh={loadAllStatuses} isLoading={isLoading} />
          
          <main className="flex-1 container mx-auto py-8 px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatusCard 
                title="Certificate Validation"
                description="Validates node identity on the blockchain"
                status={certificateStatus?.isValid}
                loading={isLoading}
              />
              <StatusCard 
                title="Controller-Switch Access"
                description="Access permission between controllers and switches"
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
                <Card className="blockchain-card h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Network Topology</CardTitle>
                    <CardDescription>
                      Software-Defined Network with access control status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <NetworkTopologyView topology={topology} />
                    <div className="flex items-center justify-center gap-6 mt-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-xs">Controller</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-violet-500"></div>
                        <span className="text-xs">Switch</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                        <span className="text-xs">Host</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-1 bg-green-500"></div>
                        <span className="text-xs">Valid Access</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-1 bg-red-500"></div>
                        <span className="text-xs">Invalid Access</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <CertificateCard 
                  certificate={certificateStatus} 
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
                          accessStatuses={[
                            controllerToSwitch,
                            switchToSwitch,
                            controllerToController
                          ].filter(Boolean) as AccessStatusPair[]}
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
              
              <div>
                <ContractInfo config={blockchainConfig} />
              </div>
            </div>
          </main>
          
          <footer className="py-6 border-t">
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
