import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { SidebarProvider } from "@/components/ui/sidebar";
import Header from "@/components/Header";
import DashboardSidebar from "@/components/DashboardSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
  getAllAccessStatuses, 
  checkCertificateValidity, 
  blockchainConfig 
} from "@/services/blockchain";
import { AccessStatusPair, CertificateStatus } from "@/types";

// Historical data structure
interface HistoricalData {
  name: string;
  validAccess: number;
  invalidAccess: number;
}

// Network data structure
interface NetworkData {
  name: string;
  connections: number;
  valid: number;
  invalid: number;
}

const Analytics = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [accessData, setAccessData] = useState<AccessStatusPair[]>([]);
  const [certificateData, setCertificateData] = useState<CertificateStatus[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [networkData, setNetworkData] = useState<NetworkData[]>([]);
  
  const refreshAnalytics = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    toast({
      title: "Refreshing analytics",
      description: "Please wait while we process the latest data...",
    });
    
    try {
      // Fetch all access statuses
      const accessStatuses = await getAllAccessStatuses();
      setAccessData(accessStatuses);
      
      // Check certificate validity for all nodes
      const certificateChecks = await Promise.all([
        checkCertificateValidity(blockchainConfig.controller1),
        checkCertificateValidity(blockchainConfig.controller2),
        checkCertificateValidity(blockchainConfig.switch1),
        checkCertificateValidity(blockchainConfig.switch2),
        checkCertificateValidity(blockchainConfig.switch3)
      ]);
      setCertificateData(certificateChecks);
      
      // Process access data for network chart
      const controllerSwitchAccess = accessStatuses.find(
        a => a.source === blockchainConfig.controller1 && a.target === blockchainConfig.switch1
      );
      const switchSwitchAccess = accessStatuses.find(
        a => a.source === blockchainConfig.switch1 && a.target === blockchainConfig.switch2
      );
      const controllerControllerAccess = accessStatuses.find(
        a => a.source === blockchainConfig.controller1 && a.target === blockchainConfig.controller2
      );
      
      const processedNetworkData: NetworkData[] = [
        { 
          name: 'Controller-Switch', 
          connections: 1, 
          valid: controllerSwitchAccess?.status ? 1 : 0, 
          invalid: controllerSwitchAccess?.status ? 0 : 1 
        },
        { 
          name: 'Switch-Switch', 
          connections: 1, 
          valid: switchSwitchAccess?.status ? 1 : 0, 
          invalid: switchSwitchAccess?.status ? 0 : 1 
        },
        { 
          name: 'Controller-Controller', 
          connections: 1, 
          valid: controllerControllerAccess?.status ? 1 : 0, 
          invalid: controllerControllerAccess?.status ? 0 : 1 
        }
      ];
      setNetworkData(processedNetworkData);
      
      // Generate historical data based on current state
      // In a real app, this would come from historical blockchain data
      const validCertCount = certificateChecks.filter(cert => cert.isValid).length;
      const invalidCertCount = certificateChecks.length - validCertCount;
      
      const validAccessCount = accessStatuses.filter(access => access.status).length;
      const invalidAccessCount = accessStatuses.length - validAccessCount;
      
      // Generate 6 months of data with some variation
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const currentMonth = new Date().getMonth();
      const historicalData: HistoricalData[] = months.map((month, index) => {
        // Add some randomness to make it look more realistic
        const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
        return {
          name: month,
          validAccess: Math.round(validAccessCount * randomFactor),
          invalidAccess: Math.round(invalidAccessCount * randomFactor)
        };
      });
      setHistoricalData(historicalData);
      
      toast({
        title: "Analytics Updated",
        description: "Dashboard has been refreshed with latest data",
      });
    } catch (error) {
      console.error("Error refreshing analytics:", error);
      toast({
        title: "Error",
        description: "Failed to refresh analytics data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    refreshAnalytics();
  }, []);
  
  // Calculate security metrics
  const validAccessRate = accessData.length > 0 
    ? Math.round((accessData.filter(a => a.status).length / accessData.length) * 100) 
    : 0;
  
  const activeConnections = accessData.length;
  
  const securityAlerts = certificateData.filter(cert => !cert.isValid).length + 
                         accessData.filter(access => !access.status).length;
  
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background text-foreground flex w-full">
        <DashboardSidebar onRefresh={refreshAnalytics} isLoading={isLoading} />
        
        <div className="flex-1 flex flex-col">
          <Header onRefresh={refreshAnalytics} isLoading={isLoading} />
          
          <main className="flex-1 container mx-auto py-8 px-4">
            <div className="mb-6">
              <h1 className="text-3xl font-bold">Analytics</h1>
              <p className="text-muted-foreground">Blockchain network performance and security metrics</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card className="blockchain-card h-full">
                <CardHeader>
                  <CardTitle>Access Attempts Over Time</CardTitle>
                  <CardDescription>Monthly breakdown of valid vs. invalid access attempts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={historicalData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="validAccess" name="Valid Access" fill="#10b981" />
                        <Bar dataKey="invalidAccess" name="Invalid Access" fill="#ef4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="blockchain-card h-full">
                <CardHeader>
                  <CardTitle>Connection Types</CardTitle>
                  <CardDescription>Distribution of network connection types</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={networkData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="valid" name="Valid Connections" fill="#10b981" />
                        <Bar dataKey="invalid" name="Invalid Connections" fill="#ef4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card className="blockchain-card">
              <CardHeader>
                <CardTitle>Network Security Overview</CardTitle>
                <CardDescription>Aggregate security metrics for the blockchain network</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-muted rounded-lg p-4 text-center">
                    <p className="text-4xl font-bold text-green-500">{validAccessRate}%</p>
                    <p className="text-sm text-muted-foreground mt-2">Valid Access Rate</p>
                  </div>
                  <div className="bg-muted rounded-lg p-4 text-center">
                    <p className="text-4xl font-bold text-blue-500">{activeConnections}</p>
                    <p className="text-sm text-muted-foreground mt-2">Active Connections</p>
                  </div>
                  <div className="bg-muted rounded-lg p-4 text-center">
                    <p className="text-4xl font-bold text-orange-500">{securityAlerts}</p>
                    <p className="text-sm text-muted-foreground mt-2">Security Alerts</p>
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

export default Analytics;
