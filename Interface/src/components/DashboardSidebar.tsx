import { useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  useSidebar
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { BarChart2, Home, KeyRound, Network, RefreshCw, Shield, Sliders, Terminal, LogOut } from "lucide-react";
import { blockchainConfig } from "@/services/blockchain";
import AddressDisplay from "./AddressDisplay";
import { toast } from "@/components/ui/use-toast";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardSidebarProps {
  onRefresh: () => void;
  isLoading: boolean;
}

const DashboardSidebar = ({ onRefresh, isLoading }: DashboardSidebarProps) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { toggleSidebar } = useSidebar();

  const handleNavigate = (path: string) => {
    navigate(path);
    if (window.innerWidth < 768) {
      toggleSidebar();
    }
  };

  const handleConsole = () => {
    toast({
      title: "Console",
      description: "Opening console feature is not implemented yet",
    });
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <Sidebar className="fixed top-0 left-0 h-full w-[var(--sidebar-width)] bg-sidebar-background text-sidebar-foreground shadow-xl transition-all duration-300 ease-in-out z-20 md:translate-x-0">
      <SidebarHeader className="px-6 py-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <Network className="h-7 w-7 text-sidebar-primary" />
          <h2 className="text-xl font-bold tracking-tight">IOTASDN</h2>
        </div>
      </SidebarHeader>
      <SidebarContent className="flex-1 py-6 space-y-6">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sm font-medium text-sidebar-foreground/70 px-6 mb-2">Navigation</SidebarGroupLabel>
          <SidebarGroupContent className="space-y-1 px-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Dashboard"
                  isActive={location.pathname === "/"}
                  onClick={() => handleNavigate("/")}
                  className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground rounded-lg py-2.5 px-4 transition-all duration-300 ease-in-out transform hover:scale-[1.02] hover:shadow-md"
                >
                  <Home className="h-5 w-5 mr-3" />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Certificate"
                  isActive={location.pathname === "/certificates"}
                  onClick={() => handleNavigate("/certificates")}
                  className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground rounded-lg py-2.5 px-4 transition-all duration-300 ease-in-out transform hover:scale-[1.02] hover:shadow-md"
                >
                  <Shield className="h-5 w-5 mr-3" />
                  <span>Certificate Management</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Network Topology"
                  isActive={location.pathname === "/network"}
                  onClick={() => handleNavigate("/network")}
                  className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground rounded-lg py-2.5 px-4 transition-all duration-300 ease-in-out transform hover:scale-[1.02] hover:shadow-md"
                >
                  <Network className="h-5 w-5 mr-3" />
                  <span>Network Topology</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Authority Operations"
                  isActive={location.pathname === "/authority-operations"}
                  onClick={() => handleNavigate("/authority-operations")}
                  className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground rounded-lg py-2.5 px-4 transition-all duration-300 ease-in-out transform hover:scale-[1.02] hover:shadow-md"
                >
                  <Shield className="h-5 w-5 mr-3" />
                  <span>Authority Operations</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Access Control Operations"
                  isActive={location.pathname === "/access-control-operations"}
                  onClick={() => handleNavigate("/access-control-operations")}
                  className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground rounded-lg py-2.5 px-4 transition-all duration-300 ease-in-out transform hover:scale-[1.02] hover:shadow-md"
                >
                  <KeyRound className="h-5 w-5 mr-3" />
                  <span>Access Control Operations</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Settings"
                  isActive={location.pathname === "/settings"}
                  onClick={() => handleNavigate("/settings")}
                  className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground rounded-lg py-2.5 px-4 transition-all duration-300 ease-in-out transform hover:scale-[1.02] hover:shadow-md"
                >
                  <Sliders className="h-5 w-5 mr-3" />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator className="bg-sidebar-border mx-6 my-4" />
        <SidebarGroup>
          <SidebarGroupLabel className="text-sm font-medium text-sidebar-foreground/70 px-6 mb-2">Actions</SidebarGroupLabel>
          <SidebarGroupContent className="space-y-2 px-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start border-sidebar-border bg-sidebar-accent/10 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-300 ease-in-out transform hover:scale-[1.02] hover:shadow-md"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Status</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start border-sidebar-border bg-sidebar-accent/10 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-300 ease-in-out transform hover:scale-[1.02] hover:shadow-md"
              onClick={handleConsole}
            >
              <Terminal className="h-4 w-4 mr-2" />
              <span>Console</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start border-sidebar-border bg-sidebar-accent/10 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-300 ease-in-out transform hover:scale-[1.02] hover:shadow-md hover:border-destructive/50 hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span>Logout</span>
            </Button>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="text-xs text-sidebar-foreground/80">
          Connected to:
          <AddressDisplay
            address={blockchainConfig.providerUrl}
            truncate={false}
            className="text-xs text-sidebar-foreground mt-1"
          />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default DashboardSidebar;
