
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, AlarmClock } from "lucide-react";

interface StatusCardProps {
  title: string;
  description: string;
  status: boolean | undefined;
  loading?: boolean;
}

const StatusCard = ({ title, description, status, loading = false }: StatusCardProps) => {
  let statusDisplay;
  
  if (loading) {
    statusDisplay = (
      <div className="flex items-center justify-center gap-2 bg-muted p-2 rounded-lg">
        <AlarmClock className="h-5 w-5 text-muted-foreground animate-pulse" />
        <span className="text-sm text-muted-foreground">Verifying...</span>
      </div>
    );
  } else if (status === undefined) {
    statusDisplay = (
      <div className="flex items-center justify-center gap-2 bg-muted p-2 rounded-lg">
        <AlarmClock className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Not checked</span>
      </div>
    );
  } else if (status) {
    statusDisplay = (
      <div className="flex items-center justify-center gap-2 bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
        <span className="text-sm text-green-700 dark:text-green-400">Valid</span>
      </div>
    );
  } else {
    statusDisplay = (
      <div className="flex items-center justify-center gap-2 bg-red-100 dark:bg-red-900/30 p-2 rounded-lg">
        <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
        <span className="text-sm text-red-700 dark:text-red-400">Invalid</span>
      </div>
    );
  }
  
  return (
    <Card className="blockchain-card h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {statusDisplay}
      </CardContent>
    </Card>
  );
};

export default StatusCard;
