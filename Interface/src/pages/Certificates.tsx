import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { SidebarProvider } from "@/components/ui/sidebar";
import { CertificateStatus } from "@/types";
import { fetchBlockchainStatus, blockchainConfig } from "@/services/blockchain";
import Header from "@/components/Header";
import DashboardSidebar from "@/components/DashboardSidebar";
import CertificateCard from "@/components/CertificateCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Certificates = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [certificateStatus, setCertificateStatus] = useState<CertificateStatus>();

  const loadCertificateStatus = async () => {
    if (isLoading) return;

    setIsLoading(true);
    toast({
      title: "Checking certificate validity",
      description: "Please wait while we verify your certificate...",
    });

    try {
      const data = await fetchBlockchainStatus();
      setCertificateStatus(data.certificateStatus);

      toast({
        title: "Certificate Checked",
        description: data.certificateStatus.isValid
          ? "Your certificate is valid"
          : "Your certificate is invalid or expired",
        variant: data.certificateStatus.isValid ? "default" : "destructive",
      });
    } catch (error) {
      console.error("Error checking certificate:", error);
      toast({
        title: "Error",
        description: "Failed to check certificate status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCertificateStatus();
  }, []);

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background text-foreground flex w-full">
        <DashboardSidebar onRefresh={loadCertificateStatus} isLoading={isLoading} />

        <div className="flex-1 flex flex-col">
          <Header onRefresh={loadCertificateStatus} isLoading={isLoading} />

          <main className="flex-1 container mx-auto py-8 px-4">
            <div className="mb-6">
              <h1 className="text-3xl font-bold">Certificate Management</h1>
              <p className="text-muted-foreground">Manage your blockchain certificates and validate node identity</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CertificateCard
                certificate={certificateStatus}
                loading={isLoading}
              />

              <Card className="blockchain-card h-full">
                <CardHeader>
                  <CardTitle>Certificate Details</CardTitle>
                  <CardDescription>Complete information about your node certificate</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Certificates are used to validate the identity of nodes on the blockchain network.
                      They contain cryptographic information that verifies the authenticity of a node.
                    </p>
                    <p className="text-sm">
                      Your certificate is currently {certificateStatus?.isValid ? (
                        <span className="text-green-500 font-medium">VALID</span>
                      ) : (
                        <span className="text-red-500 font-medium">INVALID</span>
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Certificates;
