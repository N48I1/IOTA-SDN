import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AccessStatusPair } from "@/types";
import { CheckCircle, XCircle, CircleOff } from "lucide-react";
import AddressDisplay from "./AddressDisplay";

interface AccessControlTableProps {
  accessStatuses: AccessStatusPair[];
}

const AccessControlTable = ({ accessStatuses }: AccessControlTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Source</TableHead>
          <TableHead>Target</TableHead>
          <TableHead className="w-[100px] text-center">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {accessStatuses.length > 0 ? (
          accessStatuses.map((status, index) => (
            <TableRow key={index}>
              <TableCell>
                <AddressDisplay address={status.source} />
              </TableCell>
              <TableCell>
                <AddressDisplay address={status.target} />
              </TableCell>
              <TableCell className="text-center">
                {status.status ? (
                  <CheckCircle className="h-5 w-5 text-green-500 inline-block" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 inline-block" />
                )}
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={3} className="text-center py-6">
              <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <CircleOff className="h-8 w-8" />
                <span>No access control data available</span>
              </div>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default AccessControlTable;
