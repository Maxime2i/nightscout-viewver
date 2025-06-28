import { StatCard } from "./StatCard";
import { ArrowUpRight, ArrowDownRight, Target, Clock } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { NightscoutEntry } from "@/types/nightscout";

export function StatsGrid({ data }: { data: NightscoutEntry[] }) {
  const { t } = useTranslation('common');

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

  // Trouver la date de la plus haute et la plus basse glycémie
  const highestEntry = data.length > 0
    ? data.reduce((max, entry) => (entry.sgv > max.sgv ? entry : max), data[0])
    : null;
  const lowestEntry = data.length > 0
    ? data.reduce((min, entry) => (entry.sgv < min.sgv ? entry : min), data[0])
    : null;
  const highestDate = highestEntry && highestEntry.date ? format(new Date(highestEntry.date), "dd/MM/yyyy HH:mm", { locale: fr }) : "-";
  const lowestDate = lowestEntry && lowestEntry.date ? format(new Date(lowestEntry.date), "dd/MM/yyyy HH:mm", { locale: fr }) : "-";

  return (
    <div className="grid gap-1 grid-cols-4 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title={t('StatsGrid.averageGlucose')}
        value={averageGlucose.toFixed(0) + " mg/dL"}
        description={`${timeInRangePercentage.toFixed(0)}% ${t('StatsGrid.inRange')}`}
        icon={<Target className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />}
        color="bg-blue-50"
        hideTitle
        compact
      />
      <StatCard
        title={t('StatsGrid.timeInRange')}
        value={timeInRangePercentage.toFixed(0) + "%"}
        description={t('StatsGrid.timeInRangeDescription')}
        icon={<Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />}
        color="bg-green-50"
        hideTitle
        compact
      />
      <StatCard
        title={t('StatsGrid.highestGlucose')}
        value={highestGlucose.toFixed(0) + " mg/dL"}
        description={`${highestDate}`}
        icon={<ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />}
        color="bg-red-50"
        hideTitle
        compact
      />
      <StatCard
        title={t('StatsGrid.lowestGlucose')}
        value={lowestGlucose.toFixed(0) + " mg/dL"}
        description={`${lowestDate}`}
        icon={<ArrowDownRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />}
        color="bg-yellow-50"
        hideTitle
        compact
      />
    </div>
  );
} 