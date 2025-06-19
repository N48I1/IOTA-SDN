import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle2, XCircle, Award, Info, Clock } from "lucide-react";
import AddressDisplay from "./AddressDisplay";
import { CertificateStatus } from "@/types";

interface CertificateCardProps {
  certificate: CertificateStatus | undefined;
  loading?: boolean;
}

const CertificateCard = ({ certificate, loading = false }: CertificateCardProps) => {
  return (
    <Card className="blockchain-card h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            <CardTitle className="text-xl">Certificate Status</CardTitle>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help interactive-element" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Device certificates are verified on the blockchain to ensure
                  only authorized devices can participate in the SDN.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription>
          Blockchain-verified certificate
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-4 flex flex-col justify-between">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-4 flex-1">
            <Clock className="h-10 w-10 text-muted-foreground animate-pulse" />
            <span className="mt-2 text-sm text-muted-foreground">Verifying certificate...</span>
          </div>
        ) : certificate ? (
          <>
            <div className="flex flex-col items-center justify-center p-4 flex-1">
              {certificate.isValid ? (
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle2 className="h-12 w-12 text-blockchain-success" />
                  <span className="text-blockchain-success font-semibold mt-1">Certificate Valid</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <XCircle className="h-12 w-12 text-blockchain-danger" />
                  <span className="text-blockchain-danger font-semibold mt-1">Certificate Invalid</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-border">
              <h4 className="text-sm font-medium mb-2 text-foreground">Certificate Address</h4>
              <AddressDisplay address={certificate.address} truncate={false} className="text-muted-foreground text-sm" />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-4 flex-1">
            <Info className="h-10 w-10 text-muted-foreground" />
            <span className="mt-2 text-sm text-muted-foreground">No certificate data available</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CertificateCard;
