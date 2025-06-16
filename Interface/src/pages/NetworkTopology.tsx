import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { SidebarProvider } from "@/components/ui/sidebar";
import { NetworkTopology as NetworkTopologyType, AccessStatusPair } from "@/types";
import { fetchBlockchainStatus } from "@/services/blockchain";
import { createNetworkTopology, updateNetworkWithAccessStatus } from "@/services/network";
import Header from "@/components/Header";
import DashboardSidebar from "@/components/DashboardSidebar";
import NetworkTopologyView from "@/components/NetworkTopologyView";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const NetworkTopology = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [topology, setTopology] = useState<NetworkTopologyType>(createNetworkTopology());
  const [pingTarget, setPingTarget] = useState('');
  const [pingResult, setPingResult] = useState<string | null>(null);
  const [isPinging, setIsPinging] = useState(false);

  const loadNetworkTopology = async () => {
    if (isLoading) return;

    setIsLoading(true);
    toast({
      title: "Updating network topology",
      description: "Please wait while we analyze the network...",
    });

    try {
      const data = await fetchBlockchainStatus();
      const updatedTopology = updateNetworkWithAccessStatus(topology, data.access_details);
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

  const handlePing = async () => {
    if (!pingTarget) {
      toast({
        title: "Erreur de ping",
        description: "Veuillez entrer une adresse cible pour le ping.",
        variant: "destructive",
      });
      return;
    }
    setIsPinging(true);
    setPingResult(null);
    toast({
      title: "Lancement du ping",
      description: `Ping de ${pingTarget} en cours...`,
    });

    try {
      // TODO: Replace with actual API call to your backend
      const response = await fetch(`http://localhost:5000/api/network/ping`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`, // Include JWT token
        },
        body: JSON.stringify({ target: pingTarget }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Erreur lors de l\'exécution du ping');
      }

      setPingResult(result.output);
      toast({
        title: "Ping terminé",
        description: "Résultats disponibles ci-dessous.",
      });

    } catch (error) {
      console.error("Erreur ping:", error);
      setPingResult(`Erreur: ${error instanceof Error ? error.message : String(error)}`);
      toast({
        title: "Échec du ping",
        description: error instanceof Error ? error.message : 'Une erreur est survenue lors du ping.',
        variant: "destructive",
      });
    } finally {
      setIsPinging(false);
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

            {/* Ping Test Section */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Test de Connectivité (Ping)</CardTitle>
                <CardDescription>Lancez un test ping vers une cible dans le réseau.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-end gap-4">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="ping-target">Cible (IP ou Nom d'hôte)</Label>
                    <Input
                      id="ping-target"
                      placeholder="ex: 192.168.1.1 or google.com"
                      value={pingTarget}
                      onChange={(e) => setPingTarget(e.target.value)}
                    />
                  </div>
                  <Button onClick={handlePing} disabled={isPinging}>
                    {isPinging ? 'Ping...' : 'Lancer le Ping'}
                  </Button>
                </div>
                {pingResult !== null && (
                  <div className="mt-4 p-4 bg-gray-100 rounded-md font-mono text-sm whitespace-pre-wrap">
                    <h4 className="font-semibold mb-2">Résultats du Ping :</h4>
                    {pingResult}
                  </div>
                )}
              </CardContent>
            </Card>

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
