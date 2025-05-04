
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
    <Card className="blockchain-card h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-blockchain-primary" />
            <CardTitle className="text-lg">Certificate Status</CardTitle>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
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
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center p-4">
            <div className="flex flex-col items-center gap-2">
              <Clock className="h-8 w-8 text-muted-foreground animate-pulse" />
              <span className="text-sm text-muted-foreground">Verifying certificate...</span>
            </div>
          </div>
        ) : certificate ? (
          <>
            <div className="flex items-center justify-center p-4">
              {certificate.isValid ? (
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle2 className="h-10 w-10 text-green-500" />
                  <span className="text-green-600 font-medium">Certificate Valid</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <XCircle className="h-10 w-10 text-red-500" />
                  <span className="text-red-600 font-medium">Certificate Invalid</span>
                </div>
              )}
            </div>
            
            <div className="pt-2 border-t">
              <h4 className="text-sm font-medium mb-1">Certificate Address</h4>
              <AddressDisplay address={certificate.address} truncate={false} />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center p-4">
            <span className="text-sm text-muted-foreground">No certificate data available</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CertificateCard;
