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
    <Card className="blockchain-card h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{contractName}</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
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
          Address: {address || 'N/A'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900" />
              <span className="text-sm font-medium">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {displayStatus === true ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : displayStatus === false ? (
                <XCircle className="h-4 w-4 text-red-500" />
              ) : (
                <div className="h-4 w-4 rounded-full bg-gray-300" />
              )}
              <span className="text-sm font-medium">
                {displayStatus === true ? "Valid" : displayStatus === false ? "Invalid" : "Unknown"}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ContractInfo;
