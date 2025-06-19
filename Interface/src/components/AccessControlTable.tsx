import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AccessStatusPair } from "@/types";
import { CheckCircle, XCircle, CircleOff } from "lucide-react";
import AddressDisplay from "./AddressDisplay";

interface AccessControlTableProps {
  accessStatuses: AccessStatusPair[];
}

const AccessControlTable = ({ accessStatuses }: AccessControlTableProps) => {
  return (
    <Table className="w-full caption-bottom text-sm">
      <TableHeader className="[&_tr]:border-b">
        <TableRow className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
          <TableHead className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">Source</TableHead>
          <TableHead className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">Target</TableHead>
          <TableHead className="h-12 px-4 text-center align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 w-[100px]">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="[&_tr:last-child]:border-0">
        {accessStatuses.length > 0 ? (
          accessStatuses.map((status, index) => (
            <TableRow key={index} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
              <TableCell className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
                <AddressDisplay address={status.source} className="text-sm font-medium text-foreground" />
              </TableCell>
              <TableCell className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
                <AddressDisplay address={status.target} className="text-sm font-medium text-foreground" />
              </TableCell>
              <TableCell className="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-center">
                {status.status ? (
                  <CheckCircle className="h-5 w-5 text-blockchain-success inline-block" />
                ) : (
                  <XCircle className="h-5 w-5 text-blockchain-danger inline-block" />
                )}
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={3} className="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-center py-6">
              <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <CircleOff className="h-8 w-8 text-muted-foreground/60" />
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
