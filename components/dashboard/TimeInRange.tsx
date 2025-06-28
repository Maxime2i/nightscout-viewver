import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  subDays,
  subWeeks,
  subMonths,
  startOfDay,
  endOfDay,
} from "date-fns";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useTranslation } from 'react-i18next';
import { NightscoutEntry } from "@/types/nightscout";

export function TimeInRange({
  data,
  selectedDate,
}: {
  data: NightscoutEntry[];
  selectedDate: Date;
}) {
  const { t } = useTranslation('common');
  // Sélecteur de période
  const [period, setPeriod] = useState("1jour");

  // Calcul dynamique de la période
  let startPeriod: Date;
  const endPeriod: Date = endOfDay(selectedDate);
  switch (period) {
    case "1jour":
      startPeriod = startOfDay(selectedDate);
      break;
    case "2jours":
      startPeriod = startOfDay(subDays(selectedDate, 1));
      break;
    case "1semaine":
      startPeriod = startOfDay(subWeeks(selectedDate, 1));
      break;
    case "2semaines":
      startPeriod = startOfDay(subWeeks(selectedDate, 2));
      break;
    case "1mois":
      startPeriod = startOfDay(subMonths(selectedDate, 1));
      break;
    case "2mois":
      startPeriod = startOfDay(subMonths(selectedDate, 2));
      break;
    default:
      startPeriod = startOfDay(selectedDate);
  }

  // Pourcentage de glycémie dans la cible (70-180 mg/dL)
  const periodGlucose = data.filter((e) => {
    const d = new Date(e.date);
    return d >= startPeriod && d <= endPeriod && e.sgv;
  });
  const inRange = periodGlucose.filter((e) => e.sgv >= 70 && e.sgv <= 180).length;
  const belowRange = periodGlucose.filter((e) => e.sgv < 70).length;
  const above180Range = periodGlucose.filter((e) => e.sgv > 180 && e.sgv <= 240).length;
  const above240Range = periodGlucose.filter((e) => e.sgv > 240).length;
  const percentInRange = periodGlucose.length > 0 ? (inRange / periodGlucose.length) * 100 : 0;
  const percentBelow = periodGlucose.length > 0 ? (belowRange / periodGlucose.length) * 100 : 0;
  const percentAbove180 = periodGlucose.length > 0 ? (above180Range / periodGlucose.length) * 100 : 0;
  const percentAbove240 = periodGlucose.length > 0 ? (above240Range / periodGlucose.length) * 100 : 0;

  return (
    <Card className={cn("p-4 w-full")}>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg font-bold">
          {t('TimeInRange.title')}
        </CardTitle>
        <div className="mt-2 flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
          <label htmlFor="period-select" className="mr-0 sm:mr-2">
            {t('TimeInRange.selectPeriod')}
          </label>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32 sm:w-40 max-h-6" id="period-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1jour">{t('TimeInRange.1day')}</SelectItem>
              <SelectItem value="2jours">{t('TimeInRange.2days')}</SelectItem>
              <SelectItem value="1semaine">{t('TimeInRange.1week')}</SelectItem>
              <SelectItem value="2semaines">{t('TimeInRange.2weeks')}</SelectItem>
              <SelectItem value="1mois">{t('TimeInRange.1month')}</SelectItem>
              <SelectItem value="2mois">{t('TimeInRange.2months')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {/* Graphique barre verticale colorée (4 segments) */}
        <div className="w-full flex flex-col sm:flex-row items-center mb-4 justify-center gap-4 sm:gap-6">
          <div className="h-48 w-10 flex flex-col rounded overflow-hidden border">
            <div
              className="w-full bg-orange-400 flex items-end justify-center text-xs text-white"
              style={{ height: `${percentAbove240}%`, minHeight: percentAbove240 > 0 ? 12 : 0 }}
            />
            <div
              className="w-full bg-yellow-400 flex items-end justify-center text-xs text-white"
              style={{ height: `${percentAbove180}%`, minHeight: percentAbove180 > 0 ? 12 : 0 }}
            />
            <div
              className="w-full bg-green-500 flex items-end justify-center text-xs text-white"
              style={{ height: `${percentInRange}%`, minHeight: percentInRange > 0 ? 12 : 0 }}
            />
            <div
              className="w-full bg-red-500 flex items-end justify-center text-xs text-white"
              style={{ height: `${percentBelow}%`, minHeight: percentBelow > 0 ? 12 : 0 }}
            />
          </div>
          <div className="flex flex-col justify-between h-48 text-xs py-1 gap-1">
            <span className="text-orange-400 font-bold">{t('TimeInRange.veryAbove')} : {percentAbove240.toFixed(0)}%</span>
            <span className="text-yellow-400 font-bold">{t('TimeInRange.moderatelyAbove')} : {percentAbove180.toFixed(0)}%</span>
            <span className="text-green-500 font-bold">{t('TimeInRange.inTarget')} : {percentInRange.toFixed(0)}%</span>
            <span className="text-red-500 font-bold">{t('TimeInRange.belowTarget')} : {percentBelow.toFixed(0)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
