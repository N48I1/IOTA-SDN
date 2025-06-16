import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AccessStatusPair, NetworkStatusResponse } from "@/types";
import { fetchBlockchainStatus, blockchainConfig } from "@/services/blockchain";
import Header from "@/components/Header";
import DashboardSidebar from "@/components/DashboardSidebar";
import AccessControlTable from "@/components/AccessControlTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

const AccessControl = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [accessStatuses, setAccessStatuses] = useState<AccessStatusPair[]>([]);
  const [controllerAddress, setControllerAddress] = useState<string>("");
  const [switch1Address, setSwitch1Address] = useState<string>("");
  const [switch2Address, setSwitch2Address] = useState<string>("");

  // State for Access Control contract interactions
  const [selectedAccessControlOperation, setSelectedAccessControlOperation] = useState<string>('');
  const [accessControlOperationParams, setAccessControlOperationParams] = useState<Record<string, string>>({});
  const [accessControlOperationResult, setAccessControlOperationResult] = useState<string | null>(null);
  const [isAccessControlOperationLoading, setIsAccessControlOperationLoading] = useState<boolean>(false);
  const [accessControlOperationError, setAccessControlOperationError] = useState<string | null>(null);

  const getAccessStatus = (source: string, target: string) => {
    const statusEntry = accessStatuses.find(
      (entry) => entry.source === source && entry.target === target
    );
    return statusEntry?.status;
  };

  const handleAccessControlOperation = async () => {
    setIsAccessControlOperationLoading(true);
    setAccessControlOperationResult(null);
    setAccessControlOperationError(null);

    const token = localStorage.getItem('token');
    if (!token) {
      setAccessControlOperationError("Authentication token missing.");
      setIsAccessControlOperationLoading(false);
      return;
    }

    let url = '';
    let method = 'POST';
    let body: Record<string, any> = {};

    try {
      switch (selectedAccessControlOperation) {
        case 'addController':
          url = '/api/contract/access_control/add_controller';
          body = { controllerAddress: accessControlOperationParams.controllerAddress };
          break;
        case 'addSwitch':
          url = '/api/contract/access_control/add_switch';
          body = { switchAddress: accessControlOperationParams.switchAddress };
          break;
        case 'grantAccess': // Controller to Switch
          url = '/api/contract/access_control/grant_access_cs';
          body = {
            controllerAddress: accessControlOperationParams.controllerAddress,
            switchAddress: accessControlOperationParams.switchAddress
          };
          break;
        case 'revokeAccess': // Controller to Switch
          url = '/api/contract/access_control/revoke_access_cs';
          body = {
            controllerAddress: accessControlOperationParams.controllerAddress,
            switchAddress: accessControlOperationParams.switchAddress
          };
          break;
        case 'grantControllerAccess': // Controller to Controller
          url = '/api/contract/access_control/grant_access_cc';
          body = {
            fromController: accessControlOperationParams.fromController,
            toController: accessControlOperationParams.toController
          };
          break;
        case 'revokeControllerAccess': // Controller to Controller
          url = '/api/contract/access_control/revoke_access_cc';
          body = {
            fromController: accessControlOperationParams.fromController,
            toController: accessControlOperationParams.toController
          };
          break;
        case 'grantSwitchAccess': // Switch to Switch
          url = '/api/contract/access_control/grant_access_ss';
          body = {
            switch1: accessControlOperationParams.switch1,
            switch2: accessControlOperationParams.switch2
          };
          break;
        case 'revokeSwitchAccess': // Switch to Switch
          url = '/api/contract/access_control/revoke_access_ss';
          body = {
            switch1: accessControlOperationParams.switch1,
            switch2: accessControlOperationParams.switch2
          };
          break;
        case 'addStandbyController':
          url = '/api/contract/access_control/add_standby_controller';
          body = {
            mainControllerAddress: accessControlOperationParams.mainControllerAddress,
            standbyControllerAddress: accessControlOperationParams.standbyControllerAddress
          };
          break;
        case 'removeStandbyController':
          url = '/api/contract/access_control/remove_standby_controller';
          body = {
            mainControllerAddress: accessControlOperationParams.mainControllerAddress,
            standbyControllerAddress: accessControlOperationParams.standbyControllerAddress
          };
          break;
        case 'checkAccess':
          url = `/api/contract/access_control/check_access?source=${accessControlOperationParams.source}&target=${accessControlOperationParams.target}`;
          method = 'GET';
          break;
        case 'isValid':
          url = '/api/contract/access_control/is_valid';
          method = 'GET';
          break;
        default:
          setAccessControlOperationError("Please select a valid operation.");
          setIsAccessControlOperationLoading(false);
          return;
      }

      // Prompt for private key for operations that modify state
      const stateChangingOperations = [
        'addController', 'addSwitch', 'grantAccess', 'revokeAccess',
        'grantControllerAccess', 'revokeControllerAccess', 'grantSwitchAccess', 'revokeSwitchAccess',
        'addStandbyController', 'removeStandbyController'
      ];
      if (stateChangingOperations.includes(selectedAccessControlOperation)) {
        const privateKey = prompt("Enter your private key to sign the transaction:");
        if (!privateKey) {
          throw new Error("Private key is required for this operation.");
        }
        body.privateKey = privateKey;
      }

      const fetchOptions: RequestInit = {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      };

      if (method === 'POST') {
        fetchOptions.body = JSON.stringify(body);
      }

      const response = await fetch(url, fetchOptions);
      const data = await response.json();

      if (response.ok) {
        setAccessControlOperationResult(JSON.stringify(data, null, 2));
      } else {
        setAccessControlOperationError(data.message || "Operation failed.");
      }

    } catch (err: any) {
      console.error("Error executing access control operation:", err);
      setAccessControlOperationError(err.message || "An unexpected error occurred.");
    } finally {
      setIsAccessControlOperationLoading(false);
    }
  };

  const loadAccessStatuses = async () => {
    if (isLoading) return;

    setIsLoading(true);
    toast({
      title: "Fetching access control data",
      description: "Please wait while we load the latest access control matrix...",
    });

    try {
      const data: NetworkStatusResponse = await fetchBlockchainStatus();
      setAccessStatuses(data.access_details);
      setControllerAddress(blockchainConfig.controller1 || "");
      setSwitch1Address(blockchainConfig.switch1 || "");
      setSwitch2Address(blockchainConfig.switch2 || "");

      toast({
        title: "Access Control Updated",
        description: "Access control matrix has been updated",
      });
    } catch (error) {
      console.error("Error loading access statuses:", error);
      toast({
        title: "Error",
        description: "Failed to load access control data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAccessStatuses();
  }, []);

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background text-foreground flex w-full">
        <DashboardSidebar onRefresh={loadAccessStatuses} isLoading={isLoading} />

        <div className="flex-1 flex flex-col">
          <Header onRefresh={loadAccessStatuses} isLoading={isLoading} />

          <main className="flex-1 container mx-auto py-8 px-4">
            <div className="mb-6">
              <h1 className="text-3xl font-bold">Access Control</h1>
              <p className="text-muted-foreground">Manage permissions between network components</p>
            </div>

            <Card className="blockchain-card mb-6">
              <CardHeader>
                <CardTitle>Access Control Matrix</CardTitle>
                <CardDescription>Blockchain-verified access permissions between network components</CardDescription>
              </CardHeader>
              <CardContent>
                <AccessControlTable accessStatuses={accessStatuses} />
              </CardContent>
            </Card>

            {/* Access Control Operations Section */}
            <h2 className="text-2xl font-bold mb-4 mt-8">Access Control Contract Operations</h2>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Execute Access Control Functions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="access-control-operation">Select Operation</Label>
                    <Select onValueChange={(value) => {
                      setSelectedAccessControlOperation(value);
                      setAccessControlOperationParams({}); // Clear params on operation change
                      setAccessControlOperationResult(null);
                      setAccessControlOperationError(null);
                    }} value={selectedAccessControlOperation}>
                      <SelectTrigger id="access-control-operation">
                        <SelectValue placeholder="Select a function" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="addController">addController(address _controllerAddress)</SelectItem>
                        <SelectItem value="addSwitch">addSwitch(address _switchAddress)</SelectItem>
                        <SelectItem value="grantAccess">grantAccess(address _controllerAddress, address _switchAddress) [C-S]</SelectItem>
                        <SelectItem value="revokeAccess">revokeAccess(address _controllerAddress, address _switchAddress) [C-S]</SelectItem>
                        <SelectItem value="addStandbyController">addStandbyController(address _controllerAddress, address _standbyController)</SelectItem>
                        <SelectItem value="removeStandbyController">removeStandbyController(address _controllerAddress, address _standbyController)</SelectItem>
                        <SelectItem value="grantControllerAccess">grantControllerAccess(address _fromController, address _toController) [C-C]</SelectItem>
                        <SelectItem value="revokeControllerAccess">revokeControllerAccess(address _fromController, address _toController) [C-C]</SelectItem>
                        <SelectItem value="grantSwitchAccess">grantSwitchAccess(address switch1, address switch2) [S-S]</SelectItem>
                        <SelectItem value="revokeSwitchAccess">revokeSwitchAccess(address switch1, address switch2) [S-S]</SelectItem>
                        <SelectItem value="checkAccess">checkAccess(address _controllerAddress, address _switchAddress) [C-S]</SelectItem>
                        <SelectItem value="isValid">isValid()</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Dynamic input fields based on selectedAccessControlOperation */}
                  {selectedAccessControlOperation === 'addController' && (
                    <div className="grid gap-2">
                      <Label htmlFor="addControllerAddress">Controller Address</Label>
                      <Input id="addControllerAddress" placeholder="0x..." value={accessControlOperationParams.controllerAddress || ''} onChange={(e) => setAccessControlOperationParams({ ...accessControlOperationParams, controllerAddress: e.target.value })} />
                    </div>
                  )}
                  {selectedAccessControlOperation === 'addSwitch' && (
                    <div className="grid gap-2">
                      <Label htmlFor="addSwitchAddress">Switch Address</Label>
                      <Input id="addSwitchAddress" placeholder="0x..." value={accessControlOperationParams.switchAddress || ''} onChange={(e) => setAccessControlOperationParams({ ...accessControlOperationParams, switchAddress: e.target.value })} />
                    </div>
                  )}
                  {(selectedAccessControlOperation === 'grantAccess' || selectedAccessControlOperation === 'revokeAccess') && (
                    <>
                      <div className="grid gap-2">
                        <Label htmlFor="csControllerAddress">Controller Address</Label>
                        <Input id="csControllerAddress" placeholder="0x..." value={accessControlOperationParams.controllerAddress || ''} onChange={(e) => setAccessControlOperationParams({ ...accessControlOperationParams, controllerAddress: e.target.value })} />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="csSwitchAddress">Switch Address</Label>
                        <Input id="csSwitchAddress" placeholder="0x..." value={accessControlOperationParams.switchAddress || ''} onChange={(e) => setAccessControlOperationParams({ ...accessControlOperationParams, switchAddress: e.target.value })} />
                      </div>
                    </>
                  )}
                  {(selectedAccessControlOperation === 'grantControllerAccess' || selectedAccessControlOperation === 'revokeControllerAccess') && (
                    <>
                      <div className="grid gap-2">
                        <Label htmlFor="ccFromController">From Controller Address</Label>
                        <Input id="ccFromController" placeholder="0x..." value={accessControlOperationParams.fromController || ''} onChange={(e) => setAccessControlOperationParams({ ...accessControlOperationParams, fromController: e.target.value })} />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="ccToController">To Controller Address</Label>
                        <Input id="ccToController" placeholder="0x..." value={accessControlOperationParams.toController || ''} onChange={(e) => setAccessControlOperationParams({ ...accessControlOperationParams, toController: e.target.value })} />
                      </div>
                    </>
                  )}
                  {(selectedAccessControlOperation === 'grantSwitchAccess' || selectedAccessControlOperation === 'revokeSwitchAccess') && (
                    <>
                      <div className="grid gap-2">
                        <Label htmlFor="ssSwitch1">Switch 1 Address</Label>
                        <Input id="ssSwitch1" placeholder="0x..." value={accessControlOperationParams.switch1 || ''} onChange={(e) => setAccessControlOperationParams({ ...accessControlOperationParams, switch1: e.target.value })} />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="ssSwitch2">Switch 2 Address</Label>
                        <Input id="ssSwitch2" placeholder="0x..." value={accessControlOperationParams.switch2 || ''} onChange={(e) => setAccessControlOperationParams({ ...accessControlOperationParams, switch2: e.target.value })} />
                      </div>
                    </>
                  )}
                  {(selectedAccessControlOperation === 'addStandbyController' || selectedAccessControlOperation === 'removeStandbyController') && (
                    <>
                      <div className="grid gap-2">
                        <Label htmlFor="mainControllerAddress">Main Controller Address</Label>
                        <Input id="mainControllerAddress" placeholder="0x..." value={accessControlOperationParams.mainControllerAddress || ''} onChange={(e) => setAccessControlOperationParams({ ...accessControlOperationParams, mainControllerAddress: e.target.value })} />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="standbyControllerAddress">Standby Controller Address</Label>
                        <Input id="standbyControllerAddress" placeholder="0x..." value={accessControlOperationParams.standbyControllerAddress || ''} onChange={(e) => setAccessControlOperationParams({ ...accessControlOperationParams, standbyControllerAddress: e.target.value })} />
                      </div>
                    </>
                  )}
                  {selectedAccessControlOperation === 'checkAccess' && (
                    <>
                      <div className="grid gap-2">
                        <Label htmlFor="checkAccessSource">Source Address</Label>
                        <Input id="checkAccessSource" placeholder="0x..." value={accessControlOperationParams.source || ''} onChange={(e) => setAccessControlOperationParams({ ...accessControlOperationParams, source: e.target.value })} />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="checkAccessTarget">Target Address</Label>
                        <Input id="checkAccessTarget" placeholder="0x..." value={accessControlOperationParams.target || ''} onChange={(e) => setAccessControlOperationParams({ ...accessControlOperationParams, target: e.target.value })} />
                      </div>
                    </>
                  )}

                  <Button onClick={handleAccessControlOperation} disabled={isAccessControlOperationLoading || !selectedAccessControlOperation}>
                    {isAccessControlOperationLoading ? 'Executing...' : 'Execute Operation'}
                  </Button>

                  {accessControlOperationResult && (
                    <Alert className="mt-4">
                      <AlertDescription>Result: {accessControlOperationResult}</AlertDescription>
                    </Alert>
                  )}
                  {accessControlOperationError && (
                    <Alert variant="destructive" className="mt-4">
                      <AlertDescription>Error: {accessControlOperationError}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AccessControl;
