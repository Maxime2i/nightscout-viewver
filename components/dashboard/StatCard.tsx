import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  color?: string;
  hideTitle?: boolean;
  compact?: boolean;
}

export function StatCard({ title, value, description, icon, color, hideTitle, compact }: StatCardProps) {
  return (
    <Card className={cn("p-2", color, compact ? "p-1 sm:p-2 h-18 sm:h-auto gap-2" : "")}>
      <CardHeader className={cn("flex flex-row items-center justify-between space-y-0 pb-2 p-4", compact ? "p-1 pb-1 sm:p-4 sm:pb-2" : "") }>
        <CardTitle className={cn("text-sm font-medium", hideTitle ? "hidden sm:block" : "", compact ? "text-xs truncate sm:text-sm" : "")}>{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent className={cn("p-4 pt-0", compact ? "p-1 pt-0 sm:p-4 sm:pt-0" : "") }>
        <div className={cn("font-bold", compact ? "text-xs truncate sm:text-2xl" : "text-2xl")}>{value}</div>
        <p className={cn("text-xs text-muted-foreground", compact ? "truncate text-[10px] leading-tight sm:text-xs" : "")}>{description}</p>
      </CardContent>
    </Card>
  );
} 