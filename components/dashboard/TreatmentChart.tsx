import { ResponsiveContainer, LineChart, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceDot, ReferenceArea } from "recharts";
import { format } from "date-fns";
import React from "react";



// Tooltip personnalisé pour afficher les infos du temp basal
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
    console.log("payload", payload, "active", active, "label", label);
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    if (data.tempBasal) {
      return (
        <div className="bg-white p-2 border rounded-md shadow-lg">
          <div><b>Temp Basal</b></div>
          <div>Début : {data.tempBasal.start}</div>
          <div>Fin : {data.tempBasal.end}</div>
          <div>Débit : {data.tempBasal.rate} U/h</div>
        </div>
      );
    }
    // Tu peux ajouter d'autres tooltips ici (bolus, glucides...)
  }
  return null;
};

export function TreatmentChart({ treatments, selectedDate }: { treatments: any[], selectedDate: Date }) {
  console.log("selectedDate", selectedDate);

  // Début et fin de la journée sélectionnée
  const startOfDay = new Date(selectedDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(selectedDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Extraction des bolus sur la journée
  const bolusPoints = treatments
    .filter(t => {
      const d = new Date(t.date);
      return t.insulin && t.date && d >= startOfDay && d <= endOfDay;
    })
    .map(t => ({
      time: format(new Date(t.date), "HH:mm"),
      insulin: t.insulin
    }));

  // Extraction des glucides sur la journée
  const carbsPoints = treatments
    .filter(t => {
      const d = new Date(t.date);
      return t.carbs && t.date && d >= startOfDay && d <= endOfDay;
    })
    .map(t => ({
      time: format(new Date(t.date), "HH:mm"),
      carbs: t.carbs
    }));

  // Extraction des Temp Basal sur la journée
  const tempBasalPoints = treatments
    .filter(t => {
      const d = new Date(t.date);
      return t.eventType === "Temp Basal" && t.date && t.duration && t.rate && d >= startOfDay && d <= endOfDay;
    })
    .map(t => ({
      start: format(new Date(t.date), "HH:mm"),
      end: format(new Date(new Date(t.date).getTime() + t.duration * 60000), "HH:mm"),
      rate: t.rate
    }));

  // Ticks horaires fixes pour l'axe X (identique à GlucoseTrendChart)
  const hourTicks = ["00:00", "03:00", "06:00", "09:00", "12:00", "15:00", "18:00", "21:00", "24:00"];

  // Récupère toutes les heures nécessaires pour l'axe X
  const allTimesSet = new Set([
    ...hourTicks,
    ...bolusPoints.map(p => p.time),
    ...carbsPoints.map(p => p.time),
    ...tempBasalPoints.flatMap(pt => [pt.start, pt.end])
  ]);
  // Trie chronologiquement
  const allTimes = Array.from(allTimesSet).sort((a, b) => {
    const [ah, am] = a.split(":").map(Number);
    const [bh, bm] = b.split(":").map(Number);
    return ah * 60 + am - (bh * 60 + bm);
  });

  // Génère les points pour chaque heure
  const chartData = allTimes.map(tick => {
    const bolus = bolusPoints.find(p => p.time === tick)?.insulin || null;
    const carbs = carbsPoints.find(p => p.time === tick)?.carbs || null;
    const basalObj = tempBasalPoints.find(b => b.start === tick);
    const basal = tempBasalPoints.find(b => tick >= b.start && tick < b.end)?.rate || 0;
    return {
      time: tick,
      insulin: bolus,
      carbs: carbs,
      basal: basal,
      tempBasal: basalObj ? basalObj : null
    };
  });
  console.log("tempBasalPoints", tempBasalPoints);
  return (
    <ResponsiveContainer width="100%" height="20%">
      <LineChart data={chartData} margin={{ top: 10, left: 5, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" ticks={hourTicks} allowDuplicatedCategory={false} />
        <YAxis yAxisId="left" orientation="left" domain={[0, 'dataMax']} />
        <Tooltip content={<CustomTooltip />} />
        {/* Temp Basal sous forme de barres */}
        {tempBasalPoints.map((pt, i) => (
          <ReferenceArea
            key={`tempbasal-${i}`}
            x1={pt.start}
            x2={pt.end}
            y1={0}
            y2={pt.rate}
            fill="#8fd3e8"
            fillOpacity={0.5}
            yAxisId="left"
            ifOverflow="extendDomain"
          />
        ))}
        {/* ReferenceDot invisible pour déclencher le tooltip au début de chaque temp basal */}
        {chartData.map((pt, i) =>
          pt.tempBasal ? (
            <ReferenceDot
              key={`tempbasal-dot-${i}`}
              x={pt.time}
              y={pt.tempBasal.rate}
              r={8}
              fill="transparent"
              stroke="transparent"
              yAxisId="left"
            />
          ) : null
        )}
                    <Tooltip content={<CustomTooltip />}/>

      </LineChart>
    </ResponsiveContainer>
  );
} 