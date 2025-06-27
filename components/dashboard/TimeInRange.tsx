import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  format,
  subDays,
  subWeeks,
  subMonths,
  startOfDay,
  endOfDay,
} from "date-fns";
import { fr } from "date-fns/locale";
import { StatCard } from "./StatCard";
import { Droplet, PieChart, Utensils, Target } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  color?: string;
}

export function TimeInRange({
  data,
  treatments,
  selectedDate,
}: {
  data: any[];
  treatments: any[];
  selectedDate: Date;
}) {
  // Sélecteur de période
  const [period, setPeriod] = useState("1jour");

  // Calcul dynamique de la période
  let startPeriod: Date;
  let endPeriod: Date = endOfDay(selectedDate);
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

  // Glucides ingérés (unique par identifier)
  const carbTreatments = treatments.filter((t) => {
    const d = new Date(t.date);
    return (
      t.carbs && t.date && d >= startPeriod && d <= endPeriod && t.identifier
    );
  });
  // On retire les doublons sur 'identifier'
  const uniqueCarbs = Array.from(
    new Map(carbTreatments.map((t) => [t.identifier, t])).values()
  );
  const totalCarbs = uniqueCarbs.reduce((acc, t) => acc + (t.carbs || 0), 0);

  // Insuline bolus (Meal Bolus ou Correction Bolus)
  const totalBolus = treatments
    .filter((t) => {
      const d = new Date(t.date);
      return (
        t.insulin &&
        t.date &&
        d >= startPeriod &&
        d <= endPeriod &&
        (t.eventType === "Meal Bolus" || t.eventType === "Correction Bolus")
      );
    })
    .reduce((acc, t) => acc + (t.insulin || 0), 0);

  // Insuline basal (Temp Basal)
  const totalBasal = treatments
    .filter((t) => {
      const d = new Date(t.date);
      return (
        t.eventType === "Temp Basal" &&
        t.date &&
        t.duration &&
        t.rate &&
        d >= startPeriod &&
        d <= endPeriod
      );
    })
    .reduce((acc, t) => acc + ((t.rate || 0) * (t.duration || 0)) / 60, 0); // U/h * min / 60 = U

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
    <Card className={cn("p-4")}>
      <CardHeader>
        <CardTitle className="text-lg font-bold">
          Temps passé dans la cible
        </CardTitle>
        <div className="mt-2 flex row">
          <label htmlFor="period-select" className="mr-2">
            Période :
          </label>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40 max-h-6" id="period-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1jour">1 jour</SelectItem>
              <SelectItem value="2jours">2 jours</SelectItem>
              <SelectItem value="1semaine">1 semaine</SelectItem>
              <SelectItem value="2semaines">2 semaines</SelectItem>
              <SelectItem value="1mois">1 mois</SelectItem>
              <SelectItem value="2mois">2 mois</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {/* Graphique barre verticale colorée (4 segments) */}
        <div className="w-full flex flex-row items-center mb-4 justify-center gap-6">
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
            <span className="text-orange-400 font-bold">Très au-dessus (&gt;240) : {percentAbove240.toFixed(0)}%</span>
            <span className="text-yellow-400 font-bold">Modérément au-dessus (180-240) : {percentAbove180.toFixed(0)}%</span>
            <span className="text-green-500 font-bold">Dans la cible (70-180) : {percentInRange.toFixed(0)}%</span>
            <span className="text-red-500 font-bold">Sous la cible (&lt;70) : {percentBelow.toFixed(0)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
