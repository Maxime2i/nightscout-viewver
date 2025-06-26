import { ResponsiveContainer, AreaChart, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceDot, ReferenceArea, Line, Area } from "recharts";
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

export function TreatmentChart({ treatments, selectedDate, profil }: { treatments: any[], selectedDate: Date, profil?: any }) {
  console.log("selectedDate", selectedDate);

  // Début et fin de la journée sélectionnée
  const startOfDay = new Date(selectedDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(selectedDate);
  endOfDay.setHours(23, 59, 59, 999);

  const dayStartTs = startOfDay.getTime();
  const dayEndTs = new Date(selectedDate).setHours(24, 0, 0, 0);

  const hourTicks = ["00:00", "03:00", "06:00", "09:00", "12:00", "15:00", "18:00", "21:00", "24:00"];
  const hourTickTimestamps = hourTicks.map(tick => {
    const d = new Date(selectedDate);
    const [h, m] = tick.split(':');
    d.setHours(Number(h), Number(m), 0, 0);
    return d.getTime();
  });

  const formatXAxis = (tickItem: number) => {
    return format(new Date(tickItem), 'HH:mm');
  };

  // Extraction des bolus sur la journée
  const bolusPoints = treatments
    .filter(t => {
      const d = new Date(t.date);
      return t.insulin && t.date && d >= startOfDay && d <= endOfDay;
    })
    .map(t => ({
      date: new Date(t.date).getTime(),
      insulin: t.insulin
    }));

  // Extraction des glucides sur la journée
  const carbsPoints = treatments
    .filter(t => {
      const d = new Date(t.date);
      return t.carbs && t.date && d >= startOfDay && d <= endOfDay;
    })
    .map(t => ({
      date: new Date(t.date).getTime(),
      carbs: t.carbs
    }));

  // Extraction des Temp Basal sur la journée
  const tempBasalPoints = treatments
    .filter(t => {
      const d = new Date(t.date);
      return t.eventType === "Temp Basal" && t.date && t.duration && t.rate && d >= startOfDay && d <= endOfDay;
    })
    .map(t => {
      const startTime = new Date(t.date).getTime();
      return {
        start: startTime,
        end: startTime + t.duration * 60000,
        rate: t.rate,
      };
    });

  // Trouver le profil actif pour le jour sélectionné
  let activeProfile: any = null;
  if (profil && Array.isArray(profil)) {
    const selectedDayTs = new Date(selectedDate).setHours(0, 0, 0, 0);
    activeProfile = profil
      .filter((p: any) => p.date <= selectedDayTs)
      .sort((a: any, b: any) => b.date - a.date)[0];
  }

  // Fonction pour trouver la valeur de basal programmée à un instant donné
  function getBasalProfileValueAt(ts: number) {
    if (!activeProfile) return 0;
    const basalArray = activeProfile.store[activeProfile.defaultProfile].basal;
    let last = basalArray[0];
    for (const b of basalArray) {
      const d = new Date(selectedDate);
      const [h, m] = b.time.split(":");
      d.setHours(Number(h), Number(m), 0, 0);
      if (d.getTime() <= ts) {
        last = b;
      } else {
        break;
      }
    }
    return last.value;
  }

  // Récupère toutes les heures nécessaires pour l'axe X
  const allTimestampsSet: Set<number> = new Set([
    ...hourTickTimestamps,
    ...bolusPoints.map(p => p.date),
    ...carbsPoints.map(p => p.date),
    ...tempBasalPoints.flatMap(pt => [pt.start, pt.end])
  ]);
  // Trie chronologiquement
  const allTimestamps = Array.from(allTimestampsSet).sort((a, b) => a - b);

  // Génère les points pour chaque heure
  const chartData = allTimestamps.map(ts => {
    const bolus = bolusPoints.find(p => p.date === ts)?.insulin || null;
    const carbs = carbsPoints.find(p => p.date === ts)?.carbs || null;
    const basalEvent = tempBasalPoints.find(b => b.start === ts);
    const basal = tempBasalPoints.find(b => ts >= b.start && ts < b.end)?.rate || 0;
    const basalProfile = getBasalProfileValueAt(ts);
    return {
      date: ts,
      insulin: bolus,
      carbs: carbs,
      basal: basal,
      basalProfile: basalProfile,
      tempBasal: basalEvent ? {
        start: format(new Date(basalEvent.start), "HH:mm"),
        end: format(new Date(basalEvent.end), "HH:mm"),
        rate: basalEvent.rate
      } : null
    };
  });

  console.log("tempBasalPoints", tempBasalPoints);
  return (
    <ResponsiveContainer width="100%" height="20%">
      <AreaChart data={chartData} margin={{ top: 10, left: 4, right: 4, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          type="number"
          domain={[dayStartTs, dayEndTs]}
          ticks={hourTickTimestamps}
          tickFormatter={formatXAxis}
        />
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
              x={pt.date}
              y={pt.tempBasal.rate}
              r={8}
              fill="transparent"
              stroke="transparent"
              yAxisId="left"
            />
          ) : null
        )}
        <Area
          yAxisId="left"
          type="stepAfter"
          dataKey="basalProfile"
          stroke="#8fd3e8"
          fill="#8fd3e8"
          fillOpacity={0.5}
          isAnimationActive={false}
          name="Basal programmée"
        />
        <Line
          yAxisId="left"
          type="stepAfter"
          dataKey="basalProfile"
          stroke="#8fd3e8"
          strokeWidth={2}
          dot={false}
          name="Basal programmée"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
} 