import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useTranslation } from 'react-i18next';
import { NightscoutEntry, NightscoutTreatment } from "@/types/nightscout";

export function DailyStats({ data, treatments, selectedDate }: { data: NightscoutEntry[], treatments: NightscoutTreatment[], selectedDate: Date }) {
  const { t } = useTranslation('common');
  // Début et fin de la journée sélectionnée
  const startOfDay = new Date(selectedDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(selectedDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Glucides ingérés (unique par identifier)
  const carbTreatments = treatments
    .filter(t => {
      const d = new Date(t.date);
      return t.carbs && t.date && d >= startOfDay && d <= endOfDay && t.identifier;
    });
  // On retire les doublons sur 'identifier'
  const uniqueCarbs = Array.from(
    new Map(carbTreatments.map(t => [t.identifier, t])).values()
  );
  const totalCarbs = uniqueCarbs.reduce((acc, t) => acc + (t.carbs || 0), 0);

  // Insuline bolus (Meal Bolus ou Correction Bolus)
  const totalBolus = treatments
    .filter(t => {
      const d = new Date(t.date);
      return t.insulin && t.date && d >= startOfDay && d <= endOfDay && (t.eventType === "Meal Bolus" || t.eventType === "Correction Bolus");
    })
    .reduce((acc, t) => acc + (t.insulin || 0), 0);

  // Insuline basal (Temp Basal)
  const totalBasal = treatments
    .filter(t => {
      const d = new Date(t.date);
      return t.eventType === "Temp Basal" && t.date && t.duration && t.rate && d >= startOfDay && d <= endOfDay;
    })
    .reduce((acc, t) => acc + ((t.rate || 0) * (t.duration || 0) / 60), 0); // U/h * min / 60 = U

  // Pourcentage de glycémie dans la cible (70-180 mg/dL)
  const dayGlucose = data.filter(e => {
    const d = new Date(e.date);
    return d >= startOfDay && d <= endOfDay && e.sgv;
  });
  const inRange = dayGlucose.filter(e => e.sgv >= 70 && e.sgv <= 180).length;
  const percentInRange = dayGlucose.length > 0 ? (inRange / dayGlucose.length) * 100 : 0;

  return (
    <Card className={cn("p-4 w-full")}> 
      <CardHeader>
        <CardTitle className="text-base sm:text-lg font-bold">{t('DailyStats.title')} {format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm sm:text-base">
          <li><strong>{t('DailyStats.carbsIngested')} :</strong> {totalCarbs.toFixed(0)} g</li>
          <li><strong>{t('DailyStats.insulinBolus')} :</strong> {totalBolus.toFixed(2)} U</li>
          <li><strong>{t('DailyStats.insulinBasal')} :</strong> {totalBasal.toFixed(2)} U</li>
          <li><strong>{t('DailyStats.percentageInTarget')} :</strong> {percentInRange.toFixed(0)}%</li>
        </ul>
      </CardContent>
    </Card>
  );
} 