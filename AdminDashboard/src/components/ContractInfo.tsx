
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import AddressDisplay from "./AddressDisplay";
import { BlockchainConfig } from "@/types";

interface ContractInfoProps {
  config: BlockchainConfig;
}

const ContractInfo = ({ config }: ContractInfoProps) => {
  return (
    <Card className="blockchain-card h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Smart Contract Information</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Smart contracts deployed on the IOTA EVM Testnet used for certificate 
                  verification and access control in the SDN.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription>
          Blockchain contract addresses controlling the SDN
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <h4 className="text-sm font-medium">Authority Contract</h4>
          <AddressDisplay 
            address={config.authorityContractAddress} 
            truncate={false}
            className="ml-3" 
          />
        </div>
        
        <div className="space-y-1">
          <h4 className="text-sm font-medium">Access Control Contract</h4>
          <AddressDisplay 
            address={config.accessControlContractAddress} 
            truncate={false}
            className="ml-3" 
          />
        </div>
        
        <div className="pt-2">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">Network</div>
            <span className="text-xs font-medium px-2 py-0.5 bg-muted rounded-full">
              IOTA EVM Testnet
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContractInfo;
