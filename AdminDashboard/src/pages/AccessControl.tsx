
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AccessStatusPair } from "@/types";
import { getAllAccessStatuses } from "@/services/blockchain";
import Header from "@/components/Header";
import DashboardSidebar from "@/components/DashboardSidebar";
import AccessControlTable from "@/components/AccessControlTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle } from "lucide-react";

const AccessControl = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [accessStatuses, setAccessStatuses] = useState<AccessStatusPair[]>([]);
  
  const loadAccessStatuses = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    toast({
      title: "Fetching access control data",
      description: "Please wait while we load the latest access control matrix...",
    });
    
    try {
      const statuses = await getAllAccessStatuses();
      setAccessStatuses(statuses);
      
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
            
            <Card className="blockchain-card">
              <CardHeader>
                <CardTitle>Matrix View</CardTitle>
                <CardDescription>Visualized access control permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-lg border bg-card text-card-foreground">
                  <div className="grid grid-cols-4 gap-2">
                    <div className="font-mono text-xs bg-muted rounded p-2 text-center"></div>
                    <div className="font-mono text-xs bg-muted rounded p-2 text-center">Controller</div>
                    <div className="font-mono text-xs bg-muted rounded p-2 text-center">Switch</div>
                    <div className="font-mono text-xs bg-muted rounded p-2 text-center">Host</div>
                    
                    <div className="font-mono text-xs bg-muted rounded p-2 text-center">Controller</div>
                    <div className="font-mono text-xs rounded p-2 text-center">
                      {accessStatuses[2]?.status ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 inline-block" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 inline-block" />
                      )}
                    </div>
                    <div className="font-mono text-xs rounded p-2 text-center">
                      {accessStatuses[0]?.status ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 inline-block" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 inline-block" />
                      )}
                    </div>
                    <div className="font-mono text-xs rounded p-2 text-center">N/A</div>
                    
                    <div className="font-mono text-xs bg-muted rounded p-2 text-center">Switch</div>
                    <div className="font-mono text-xs rounded p-2 text-center">N/A</div>
                    <div className="font-mono text-xs rounded p-2 text-center">
                      {accessStatuses[1]?.status ? (
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
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AccessControl;
