import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, AlarmClock } from "lucide-react";

interface StatusCardProps {
  title: string;
  description: string;
  status?: boolean;
  loading?: boolean;
  details?: string;
}

const StatusCard = ({ title, description, status, loading, details }: StatusCardProps) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900" />
            ) : status === undefined ? (
              <div className="h-4 w-4 rounded-full bg-gray-300" />
            ) : status ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm font-medium">
              {loading ? "Loading..." : status === undefined ? "Unknown" : status ? "Valid" : "Invalid"}
            </span>
          </div>
        </div>
        {details && (
          <div className="mt-2 text-sm text-muted-foreground">
            {details}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatusCard;
