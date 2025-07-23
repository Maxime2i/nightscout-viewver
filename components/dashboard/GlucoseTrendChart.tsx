"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Label,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TreatmentChart } from "./TreatmentChart";
import { useTranslation } from 'react-i18next';
import { NightscoutEntry, NightscoutTreatment, NightscoutProfile } from "@/types/nightscout";
import { useGlucoseUnits } from "@/lib/glucoseUnits";

interface TooltipPayload {
  value: number;
  name: string;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  const { formatGlucose } = useGlucoseUnits();
  
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border rounded-md shadow-lg">
        <p className="font-bold">{label}</p>
        <p className="text-blue-500">{`Glucose : ${formatGlucose(payload[0].value)}`}</p>
      </div>
    );
  }

  return null;
};

export function GlucoseTrendChart({ data, treatments, selectedDate, setSelectedDate, profil }: { data: NightscoutEntry[], treatments: NightscoutTreatment[], selectedDate: Date, setSelectedDate: (date: Date) => void, profil?: NightscoutProfile }) {
  const { t } = useTranslation('common');
  const { convertGlucose, convertRange, unit } = useGlucoseUnits();

  // Calcul des dates disponibles (jours avec données)
  const availableDates = Array.from(
    new Set(data.map(e => {
      const d = new Date(e.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }))
  ).sort((a, b) => a - b);

  const minDate = availableDates.length ? new Date(availableDates[0]) : null;
  const maxDate = availableDates.length ? new Date(availableDates[availableDates.length - 1]) : null;

  const isPrevDisabled = !!minDate && selectedDate.getTime() <= minDate.getTime();
  const isNextDisabled = !!maxDate && selectedDate.getTime() >= maxDate.getTime();

  // Ticks horaires fixes pour l'axe X (00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00, 24:00)
  const hourTicks = ["00:00", "03:00", "06:00", "09:00", "12:00", "15:00", "18:00", "21:00", "24:00"];

  const dayStartTs = new Date(selectedDate).setHours(0, 0, 0, 0);
  const dayEndTs = new Date(selectedDate).setHours(24, 0, 0, 0);

  const hourTickTimestamps = hourTicks.map(tick => {
    const d = new Date(selectedDate);
    const [h, m] = tick.split(':');
    d.setHours(Number(h), Number(m), 0, 0);
    return d.getTime();
  });

  const formatXAxis = (tickItem: number) => {
    return format(new Date(tickItem), 'HH:mm');
  };

  // Points réels du jour sélectionné
  const realPoints = data
    .filter(e => {
      if (!e.sgv) return false;
      const d = new Date(e.date);
      return (
        d.getDate() === selectedDate.getDate() &&
        d.getMonth() === selectedDate.getMonth() &&
        d.getFullYear() === selectedDate.getFullYear()
      );
    })
    .map(e => {
      const d = new Date(e.date);
      return {
        time: format(d, "HH:mm"),
        glucose: convertGlucose(e.sgv),
        date: d.getTime(),
      };
    });

  // Points vides pour les heures fixes si aucun point réel n'existe à cette heure
  const fixedHourPoints = hourTicks.map(tick => {
    // Vérifier si un point réel existe déjà à cette heure
    const exists = realPoints.some(p => p.time === tick);
    if (exists) return null;
    // Créer un point vide
    const d = new Date(selectedDate);
    const [h, m] = tick.split(":");
    d.setHours(Number(h), Number(m), 0, 0);
    return {
      time: tick,
      glucose: null,
      date: d.getTime(),
    };
  }).filter(Boolean);

  // Fusionner et trier tous les points
  const chartDataDay = [...realPoints, ...fixedHourPoints]
    .filter(Boolean)
    .sort((a, b) => (a!.date - b!.date));

  // Gestion des jours précédent/suivant
  const goToPreviousDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    prev.setHours(0, 0, 0, 0);
    if (availableDates.includes(prev.getTime())) {
      setSelectedDate(prev);
    }
  };
  const goToNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    next.setHours(0, 0, 0, 0);
    if (availableDates.includes(next.getTime())) {
      setSelectedDate(next);
    }
  };

  const INSULIN_SCALE_FACTOR = 5;
  const CARBS_SCALE_FACTOR = 0.8;

  // Définir les ticks pour l'axe Y selon l'unité
  const yAxisTicks = unit === 'mmol/L' 
    ? [2.2, 4.4, 6.7, 8.9, 11.1, 13.3, 15.6, 16.7] // Ticks arrondis pour mmol/L
    : [40, 80, 120, 160, 200, 240, 280, 300]; // Ticks pour mg/dL

  const bolusTreatments = treatments
    .filter(t => {
      if (!t.date || !t.eventType || !t.insulin) return false;
      const d = new Date(t.date);
      const isSameDay =
        d.getDate() === selectedDate.getDate() &&
        d.getMonth() === selectedDate.getMonth() &&
        d.getFullYear() === selectedDate.getFullYear();
      return (
        isSameDay &&
        (t.eventType === "Meal Bolus" || t.eventType === "Correction Bolus")
      );
    })
    .map(t => ({
      date: new Date(t.date).getTime(),
      type: t.eventType,
      insulin: t.insulin,
    }));

  const carbTreatments = treatments
    .filter(t => {
      if (!t.date || !t.carbs || t.carbs === 0) return false;
      const d = new Date(t.date);
      const isSameDay =
        d.getDate() === selectedDate.getDate() &&
        d.getMonth() === selectedDate.getMonth() &&
        d.getFullYear() === selectedDate.getFullYear();
      return isSameDay;
    })
    .map(t => ({
      date: new Date(t.date).getTime(),
      carbs: t.carbs,
    }));

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
        <div>
          <CardTitle>{t('GlucoseTrendChart.title')}</CardTitle>
          <CardDescription>{t('GlucoseTrendChart.description')}</CardDescription>
        </div>
        <div className="flex items-center gap-2 min-w-0 sm:min-w-[320px] justify-center w-full sm:w-auto mt-2 sm:mt-0">
          <button
            onClick={goToPreviousDay}
            aria-label="Jour précédent"
            disabled={isPrevDisabled}
            className={isPrevDisabled ? "opacity-50 cursor-not-allowed" : ""}
          >
            <ChevronLeft />
          </button>
          <span className="font-semibold mx-2 sm:mx-4 min-w-0 sm:min-w-[200px] text-center truncate">
            {format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })}
          </span>
          <button
            onClick={goToNextDay}
            aria-label="Jour suivant"
            disabled={isNextDisabled}
            className={isNextDisabled ? "opacity-50 cursor-not-allowed" : ""}
          >
            <ChevronRight />
          </button>
        </div>
      </CardHeader>
      <CardContent className="h-[500px] w-full mb-4">
        <ResponsiveContainer width="100%" height="80%">
          
          <LineChart data={chartDataDay}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              type="number"
              domain={[dayStartTs, dayEndTs]}
              ticks={hourTickTimestamps}
              tickFormatter={formatXAxis}
            />
            <YAxis 
              domain={[convertGlucose(40), convertGlucose(300)]} 
              ticks={yAxisTicks}
              tickFormatter={(value) => {
                if (unit === 'mmol/L') {
                  return value.toFixed(1);
                }
                return Math.round(value).toString();
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={convertGlucose(180)} stroke="red" strokeDasharray="3 3" />
            <ReferenceLine y={convertGlucose(70)} stroke="red" strokeDasharray="3 3" />

            {carbTreatments.map((carbs, index) => (
              <ReferenceLine
                key={`carbs-${index}`}
                segment={[
                  { x: carbs.date, y: 40 },
                  { x: carbs.date, y: 40 + (carbs.carbs || 0) * CARBS_SCALE_FACTOR },
                ]}
                stroke={"#f59e0b"}
                strokeWidth={2}
              >
                <Label
                  value={`${carbs.carbs} g`}
                  angle={-45}
                  position="top"
                  textAnchor="end"
                  fill={"#f59e0b"}
                  fontSize="12"
                  dx={10}
                  dy={-5}
                />
              </ReferenceLine>
            ))}
            
            {bolusTreatments.map((bolus, index) => (
              <ReferenceLine
                key={`bolus-${index}`}
                segment={[
                  { x: bolus.date, y: 40 },
                  { x: bolus.date, y: 40 + (bolus.insulin || 0) * INSULIN_SCALE_FACTOR },
                ]}
                stroke={bolus.type === "Meal Bolus" ? "#be185d" : "#10b981"}
                strokeWidth={2}
              >
                <Label
                  value={`${bolus.insulin} U`}
                  angle={-45}
                  position="top"
                  textAnchor="end"
                  fill={bolus.type === "Meal Bolus" ? "#be185d" : "#10b981"}
                  fontSize="12"
                  dx={10}
                  dy={-5}
                />
              </ReferenceLine>
            ))}

            

            <Line
              type="monotone"
              dataKey="glucose"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 4, fill: "#3b82f6" }}
              activeDot={{ r: 8 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex justify-center items-center gap-6 mt-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-blue-500" />
            <span>{t('GlucoseTrendChart.glucose')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3" style={{ backgroundColor: '#f59e0b' }} />
            <span>{t('GlucoseTrendChart.mealBolus')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3" style={{ backgroundColor: '#10b981' }} />
            <span>{t('GlucoseTrendChart.correctionBolus')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3" style={{ backgroundColor: '#be185d' }} />
            <span>{t('GlucoseTrendChart.carbs')}</span>
          </div>
        </div>
          <TreatmentChart treatments={treatments} selectedDate={selectedDate} profil={profil}/>


      </CardContent>
    </Card>
  );
} 