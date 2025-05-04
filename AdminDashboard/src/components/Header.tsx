import { Button } from "@/components/ui/button";
import { 
  Network, 
  Shield, 
  Layers, 
  Database, 
  RefreshCw,
  Menu
} from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { toast } from "@/components/ui/use-toast";

interface HeaderProps {
  onRefresh: () => void;
  isLoading?: boolean;
}

const Header = ({ onRefresh, isLoading = false }: HeaderProps) => {
  const { toggleSidebar, state } = useSidebar();

  const handleRefresh = () => {
    toast({
      title: "Refreshing...",
      description: "Fetching latest blockchain status",
    });
    onRefresh();
  };

  // Add animation class based on sidebar state
  const headerClasses = `bg-card border-b shadow-sm py-4 transition-all duration-300 ${
    state === "expanded" ? "md:pl-[var(--sidebar-width)]" : ""
  }`;

  return (
    <header className={headerClasses}>
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden" 
            onClick={toggleSidebar}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Network className="h-8 w-8 text-blockchain-primary" />
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold tracking-tight">IOTASDN</h1>
              <p className="text-muted-foreground text-sm">Certificate Validation & Access Control</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-muted">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs font-medium">Connected to Blockchain</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="hidden md:flex items-center gap-2"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Status</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
