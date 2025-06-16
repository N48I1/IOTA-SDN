import { CheckCircle2, XCircle, AlarmClock } from "lucide-react";

interface StatusIndicatorProps {
    status?: boolean;
    loading?: boolean;
}

const StatusIndicator = ({ status, loading }: StatusIndicatorProps) => {
    return (
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
    );
};

export default StatusIndicator; 