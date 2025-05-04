
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { SidebarProvider } from "@/components/ui/sidebar";
import { NetworkTopology as NetworkTopologyType } from "@/types";
import { getAllAccessStatuses } from "@/services/blockchain";
import { createNetworkTopology, updateNetworkWithAccessStatus } from "@/services/network";
import Header from "@/components/Header";
import DashboardSidebar from "@/components/DashboardSidebar";
import NetworkTopologyView from "@/components/NetworkTopologyView";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const NetworkTopology = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [topology, setTopology] = useState<NetworkTopologyType>(createNetworkTopology());
  
  const loadNetworkTopology = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    toast({
      title: "Updating network topology",
      description: "Please wait while we analyze the network...",
    });
    
    try {
      const accessStatuses = await getAllAccessStatuses();
      const updatedTopology = updateNetworkWithAccessStatus(topology, accessStatuses);
      setTopology(updatedTopology);
      
      toast({
        title: "Topology Updated",
        description: "Network topology has been refreshed",
      });
    } catch (error) {
      console.error("Error loading network topology:", error);
      toast({
        title: "Error",
        description: "Failed to update network topology",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadNetworkTopology();
  }, []);
  
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background text-foreground flex w-full">
        <DashboardSidebar onRefresh={loadNetworkTopology} isLoading={isLoading} />
        
        <div className="flex-1 flex flex-col">
          <Header onRefresh={loadNetworkTopology} isLoading={isLoading} />
          
          <main className="flex-1 container mx-auto py-8 px-4">
            <div className="mb-6">
              <h1 className="text-3xl font-bold">Network Topology</h1>
              <p className="text-muted-foreground">Visualize the software-defined network with access control</p>
            </div>
            
            <Card className="blockchain-card h-full">
              <CardHeader>
                <CardTitle>Network View</CardTitle>
                <CardDescription>Software-Defined Network with access control status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[500px]">
                  <NetworkTopologyView topology={topology} />
                </div>
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
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default NetworkTopology;
