import { StatCard } from "./StatCard";
import { ArrowDownUp, ArrowUpRight, ArrowDownRight, Target, Clock } from "lucide-react";

export function StatsGrid({ data }: { data: any[] }) {
  console.log("data", data);
  const averageGlucose = data.reduce((acc, entry) => acc + entry.sgv, 0) / data.length;
  const highestGlucose = data.reduce((acc, entry) => Math.max(acc, entry.sgv), 0);
  const lowestGlucose = data.reduce((acc, entry) => Math.min(acc, entry.sgv), 1000);
  const timeInRange = data.reduce((acc, entry) => {
    if (entry.sgv >= 70 && entry.sgv <= 180) {
      return acc + 1;
    }
    return acc;
  }, 0);
  const timeInRangePercentage = (timeInRange / data.length) * 100;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Average Glucose"
        value={averageGlucose.toFixed(0) + " mg/dL"}
        description={`${timeInRangePercentage.toFixed(0)}% in range`}
        icon={<Target className="h-4 w-4 text-muted-foreground" />}
        color="bg-blue-50"
      />
      <StatCard
        title="Time in Range"
        value={timeInRangePercentage.toFixed(0) + "%"}
        description="70-180 mg/dL target"
        icon={<Clock className="h-4 w-4 text-muted-foreground" />}
        color="bg-green-50"
      />
      <StatCard
        title="Highest (7d)"
        value={highestGlucose.toFixed(0) + " mg/dL"}
        description="Yesterday, 3:45 PM"
        icon={<ArrowUpRight className="h-4 w-4 text-muted-foreground" />}
        color="bg-red-50"
      />
      <StatCard
        title="Lowest (7d)"
        value={lowestGlucose.toFixed(0) + " mg/dL"}
        description="3 days ago, 11:20 PM"
        icon={<ArrowDownRight className="h-4 w-4 text-muted-foreground" />}
        color="bg-yellow-50"
      />
    </div>
  );
} 