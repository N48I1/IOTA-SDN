
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Copy, Check, ExternalLink } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface AddressDisplayProps {
  address: string;
  label?: string;
  truncate?: boolean;
  className?: string;
}

const AddressDisplay = ({ 
  address, 
  label, 
  truncate = true, 
  className 
}: AddressDisplayProps) => {
  const [copied, setCopied] = useState(false);
  
  const displayAddress = truncate 
    ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
    : address;
    
  const copyToClipboard = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const openExplorer = () => {
    window.open(`https://explorer.evm.testnet.iotaledger.net/address/${address}`, '_blank');
  };
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {label && <span className="text-muted-foreground text-sm">{label}:</span>}
      <div className="flex items-center gap-1.5">
        <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
          {displayAddress}
        </code>
        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none">
            <div className="h-5 w-5 rounded-full hover:bg-muted flex items-center justify-center">
              {copied ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={copyToClipboard}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Address
            </DropdownMenuItem>
            <DropdownMenuItem onClick={openExplorer}>
              <ExternalLink className="h-4 w-4 mr-2" />
              View in Explorer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default AddressDisplay;
