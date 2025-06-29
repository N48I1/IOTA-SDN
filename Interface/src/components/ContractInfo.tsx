import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, Clock, CheckCircle2, XCircle } from "lucide-react";
import AddressDisplay from "./AddressDisplay";

interface ContractInfoProps {
  contractName: string;
  address: string | undefined;
  isValid: boolean | undefined;
  loading?: boolean;
}

const ContractInfo = ({ contractName, address, isValid, loading = false }: ContractInfoProps) => {
  const displayStatus = typeof isValid === 'boolean' ? isValid : undefined;

  return (
    <Card className="blockchain-card h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{contractName}</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help interactive-element" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Blockchain contract address for {contractName}.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription>
          Address: <AddressDisplay address={address || 'N/A'} truncate={true} className="inline text-muted-foreground" />
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex items-end">
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-foreground" />
            <span className="text-foreground font-medium">Loading...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {displayStatus === true ? (
              <CheckCircle2 className="h-5 w-5 text-blockchain-success" />
            ) : displayStatus === false ? (
              <XCircle className="h-5 w-5 text-blockchain-danger" />
            ) : (
              <div className="h-5 w-5 rounded-full bg-muted-foreground/50" />
            )}
            <span className="text-foreground font-medium">
              {displayStatus === true ? "Valid" : displayStatus === false ? "Invalid" : "Unknown"}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ContractInfo;
