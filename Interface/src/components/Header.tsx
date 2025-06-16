import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Network,
  RefreshCw,
  Menu
} from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { toast } from "@/components/ui/use-toast";

interface HeaderProps {
  onRefresh?: () => void;
  isLoading?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onRefresh, isLoading = false }) => {
  const { toggleSidebar } = useSidebar();

  const handleRefresh = () => {
    toast({
      title: "Refreshing...",
      description: "Fetching latest blockchain status",
    });
    onRefresh?.();
  };

  return (
    <header className="bg-card transition-all duration-300 sticky top-0 z-10 w-full h-16 border-b border-border shadow-sm backdrop-blur-sm">
      <div className="container mx-auto flex items-center justify-between h-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 h-full">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-muted-foreground hover:text-foreground"
            onClick={toggleSidebar}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 h-full">
            <Network className="h-7 w-7 text-primary" />
            <div className="flex flex-col justify-center h-full">
              <h1 className="text-xl font-bold tracking-tight">IOTASDN</h1>
              <p className="text-muted-foreground text-xs">Network Monitoring Dashboard</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 h-full">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            <span>Connected to Blockchain</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="hidden md:flex items-center gap-2 border-border text-foreground hover:bg-muted/50"
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
