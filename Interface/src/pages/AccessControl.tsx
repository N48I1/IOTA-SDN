import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AccessStatusPair, NetworkStatusResponse } from "@/types";
import { fetchBlockchainStatus, blockchainConfig } from "@/services/blockchain";
import Header from "@/components/Header";
import DashboardSidebar from "@/components/DashboardSidebar";
import AccessControlTable from "@/components/AccessControlTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import StatusIndicator from "@/components/StatusIndicator";

const AccessControl = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [accessStatuses, setAccessStatuses] = useState<AccessStatusPair[]>([]);
  const [controllerAddress, setControllerAddress] = useState<string>("");
  const [switch1Address, setSwitch1Address] = useState<string>("");
  const [switch2Address, setSwitch2Address] = useState<string>("");

  const getAccessStatus = (source: string, target: string) => {
    const statusEntry = accessStatuses.find(
      (entry) => entry.source === source && entry.target === target
    );
    return statusEntry?.status;
  };

  const loadAccessStatuses = async () => {
    if (isLoading) return;

    setIsLoading(true);
    toast({
      title: "Fetching access control data",
      description: "Please wait while we load the latest access control matrix...",
    });

    try {
      const data: NetworkStatusResponse = await fetchBlockchainStatus();
      setAccessStatuses(data.access_details);
      setControllerAddress(blockchainConfig.controller1 || "");
      setSwitch1Address(blockchainConfig.switch1 || "");
      setSwitch2Address(blockchainConfig.switch2 || "");

      toast({
        title: "Access Control Updated",
        description: "Access control matrix has been updated",
      });
    } catch (error) {
      console.error("Error loading access statuses:", error);
      toast({
        title: "Error",
        description: "Failed to load access control data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAccessStatuses();
  }, []);

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background text-foreground flex w-full">
        <DashboardSidebar onRefresh={loadAccessStatuses} isLoading={isLoading} />

        <div className="flex-1 flex flex-col">
          <Header onRefresh={loadAccessStatuses} isLoading={isLoading} />

          <main className="flex-1 container mx-auto py-8 px-4">
            <div className="mb-6">
              <h1 className="text-3xl font-bold">Access Control</h1>
              <p className="text-muted-foreground">Manage permissions between network components</p>
            </div>

            <Card className="blockchain-card mb-6">
              <CardHeader>
                <CardTitle>Access Control Matrix</CardTitle>
                <CardDescription>Blockchain-verified access permissions between network components</CardDescription>
              </CardHeader>
              <CardContent>
                <AccessControlTable accessStatuses={accessStatuses} />
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AccessControl;
