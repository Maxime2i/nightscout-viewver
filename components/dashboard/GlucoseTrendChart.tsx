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
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TreatmentChart } from "./TreatmentChart";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border rounded-md shadow-lg">
        <p className="font-bold">{label}</p>
        <p className="text-blue-500">{`Glucose : ${payload[0].value} mg/dL`}</p>
      </div>
    );
  }

  return null;
};

export function GlucoseTrendChart({ data, treatments }: { data: any[], treatments: any[] }) {

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

  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    // Si la date du jour n'a pas de données, prendre la plus récente disponible
    if (availableDates.length && !availableDates.includes(now.getTime())) {
      return new Date(availableDates[availableDates.length - 1]);
    }
    return now;
  });

  const isPrevDisabled = !!minDate && selectedDate.getTime() <= minDate.getTime();
  const isNextDisabled = !!maxDate && selectedDate.getTime() >= maxDate.getTime();

  // Ticks horaires fixes pour l'axe X (00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00, 23:00)
  const hourTicks = ["00:00", "03:00", "06:00", "09:00", "12:00", "15:00", "18:00", "21:00", "24:00"];

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
        glucose: e.sgv,
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Tendance glycémique</CardTitle>
          <CardDescription>Suis tes glycémies sur la journée</CardDescription>
        </div>
        <div className="flex items-center gap-2 min-w-[320px] justify-center">
          <button
            onClick={goToPreviousDay}
            aria-label="Jour précédent"
            disabled={isPrevDisabled}
            className={isPrevDisabled ? "opacity-50 cursor-not-allowed" : ""}
          >
            <ChevronLeft />
          </button>
          <span className="font-semibold mx-4 min-w-[200px] text-center">
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
      <CardContent className="h-[500px] w-full">
        <ResponsiveContainer width="100%" height="80%">
          
          <LineChart data={chartDataDay}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="time" ticks={hourTicks} allowDuplicatedCategory={false} />
            <YAxis domain={[40, 300]} ticks={[40, 80, 120, 160, 200, 240, 280, 300]} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={180} stroke="red" strokeDasharray="3 3" />
            <ReferenceLine y={70} stroke="red" strokeDasharray="3 3" />
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
          <TreatmentChart treatments={treatments} selectedDate={selectedDate}/>


      </CardContent>
    </Card>
  );
} 