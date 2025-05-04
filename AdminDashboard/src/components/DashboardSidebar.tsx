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
    // If we're on mobile, close the sidebar after navigation
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
    navigate("/login");
  };

  return (
    <Sidebar className="fixed top-0 left-0 h-full w-64 bg-white shadow-md">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2">
          <Network className="h-6 w-6 text-blockchain-primary" />
          <h2 className="text-lg font-semibold">IOTASDN</h2>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  tooltip="Dashboard" 
                  isActive={location.pathname === "/"} 
                  onClick={() => handleNavigate("/")}
                >
                  <Home className="h-5 w-5" />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  tooltip="Certificate" 
                  isActive={location.pathname === "/certificates"} 
                  onClick={() => handleNavigate("/certificates")}
                >
                  <Shield className="h-5 w-5" />
                  <span>Certificate Management</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  tooltip="Access Control" 
                  isActive={location.pathname === "/access-control"} 
                  onClick={() => handleNavigate("/access-control")}
                >
                  <KeyRound className="h-5 w-5" />
                  <span>Access Control</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  tooltip="Network Topology" 
                  isActive={location.pathname === "/network"} 
                  onClick={() => handleNavigate("/network")}
                >
                  <Network className="h-5 w-5" />
                  <span>Network Topology</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  tooltip="Analytics" 
                  isActive={location.pathname === "/analytics"} 
                  onClick={() => handleNavigate("/analytics")}
                >
                  <BarChart2 className="h-5 w-5" />
                  <span>Analytics</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  tooltip="Settings" 
                  isActive={location.pathname === "/settings"} 
                  onClick={() => handleNavigate("/settings")}
                >
                  <Sliders className="h-5 w-5" />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupLabel>Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="space-y-2 px-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={onRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Status</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={handleConsole}
              >
                <Terminal className="h-4 w-4 mr-2" />
                <span>Console</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span>Logout</span>
              </Button>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default DashboardSidebar;
