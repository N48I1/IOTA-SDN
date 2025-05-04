
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { SidebarProvider } from "@/components/ui/sidebar";
import { blockchainConfig } from "@/services/blockchain";
import Header from "@/components/Header";
import DashboardSidebar from "@/components/DashboardSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

const Settings = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form states
  const [providerUrl, setProviderUrl] = useState(blockchainConfig.providerUrl);
  const [myAddress, setMyAddress] = useState(blockchainConfig.myAddress);
  const [contractAddress, setContractAddress] = useState(blockchainConfig.contractAddress);
  const [darkMode, setDarkMode] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  
  const handleSaveBlockchain = (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    toast({
      title: "Saving blockchain settings",
      description: "Please wait while we update your configuration...",
    });
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Settings Saved",
        description: "Your blockchain configuration has been updated",
      });
    }, 1500);
  };
  
  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    toast({
      title: "Saving preferences",
      description: "Please wait while we update your preferences...",
    });
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Preferences Saved",
        description: "Your application preferences have been updated",
      });
    }, 1000);
  };
  
  const handleRefresh = () => {
    toast({
      title: "Refreshing Settings",
      description: "Loading latest configuration...",
    });
  };
  
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background text-foreground flex w-full">
        <DashboardSidebar onRefresh={handleRefresh} isLoading={isLoading} />
        
        <div className="flex-1 flex flex-col">
          <Header onRefresh={handleRefresh} isLoading={isLoading} />
          
          <main className="flex-1 container mx-auto py-8 px-4">
            <div className="mb-6">
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground">Configure your blockchain dashboard</p>
            </div>
            
            <Tabs defaultValue="blockchain">
              <TabsList className="mb-6">
                <TabsTrigger value="blockchain">Blockchain</TabsTrigger>
                <TabsTrigger value="preferences">Preferences</TabsTrigger>
                <TabsTrigger value="network">Network</TabsTrigger>
              </TabsList>
              
              <TabsContent value="blockchain">
                <Card className="blockchain-card">
                  <CardHeader>
                    <CardTitle>Blockchain Configuration</CardTitle>
                    <CardDescription>Configure blockchain connection settings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSaveBlockchain} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="providerUrl">Provider URL</Label>
                          <Input 
                            id="providerUrl" 
                            value={providerUrl} 
                            onChange={(e) => setProviderUrl(e.target.value)} 
                            placeholder="https://eth-provider.example.com" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contractAddress">Contract Address</Label>
                          <Input 
                            id="contractAddress" 
                            value={contractAddress} 
                            onChange={(e) => setContractAddress(e.target.value)} 
                            placeholder="0x..." 
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="myAddress">My Wallet Address</Label>
                        <Input 
                          id="myAddress" 
                          value={myAddress} 
                          onChange={(e) => setMyAddress(e.target.value)} 
                          placeholder="0x..." 
                        />
                      </div>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Saving..." : "Save Blockchain Settings"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="preferences">
                <Card className="blockchain-card">
                  <CardHeader>
                    <CardTitle>Application Preferences</CardTitle>
                    <CardDescription>Customize your dashboard experience</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSavePreferences} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="darkMode">Dark Mode</Label>
                        <Switch 
                          id="darkMode" 
                          checked={darkMode} 
                          onCheckedChange={setDarkMode} 
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="notifications">Enable Notifications</Label>
                        <Switch 
                          id="notifications" 
                          checked={notificationsEnabled} 
                          onCheckedChange={setNotificationsEnabled} 
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="autoRefresh">Auto-refresh Data</Label>
                        <Switch 
                          id="autoRefresh" 
                          checked={autoRefresh} 
                          onCheckedChange={setAutoRefresh} 
                        />
                      </div>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Saving..." : "Save Preferences"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="network">
                <Card className="blockchain-card">
                  <CardHeader>
                    <CardTitle>Network Settings</CardTitle>
                    <CardDescription>Configure network parameters</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Network settings are currently managed through the blockchain smart contract.
                      Contact your network administrator to modify network parameters.
                    </p>
                    <div className="bg-muted p-4 rounded-lg">
                      <code className="text-sm whitespace-pre-wrap">
                        Network Type: Software-Defined Network (SDN)<br />
                        Protocol Version: 1.2.3<br />
                        Last Updated: 2025-04-09
                      </code>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Settings;
