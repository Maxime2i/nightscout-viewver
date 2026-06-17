import {
  NightscoutEntry,
  NightscoutTreatment,
  NightscoutProfile,
} from "@/types/nightscout";

export const DEMO_NIGHTSCOUT_URL = "demo";
export const DEMO_NIGHTSCOUT_TOKEN = "demo";

export function isDemoMode(url: string | null | undefined): boolean {
  return url === DEMO_NIGHTSCOUT_URL;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function glucoseAtHour(hour: number, minute: number): number {
  const t = hour + minute / 60;
  let base = 115;

  // Phénomène de l'aube
  if (t >= 4 && t < 8) base += 25 * Math.sin(((t - 4) / 4) * Math.PI);

  // Repas
  const mealSpikes = [
    { h: 7.5, amp: 55, width: 1.2 },
    { h: 12.5, amp: 70, width: 1.5 },
    { h: 19, amp: 60, width: 1.3 },
  ];
  for (const meal of mealSpikes) {
    const dist = t - meal.h;
    base += meal.amp * Math.exp(-(dist * dist) / (2 * meal.width * meal.width));
  }

  // Baisse nocturne
  if (t >= 0 && t < 4) base -= 10;

  // Activité en fin d'après-midi
  if (t >= 16 && t < 17.5) base -= 20 * Math.sin(((t - 16) / 1.5) * Math.PI);

  return base;
}

function trendFromDelta(delta: number): { direction: string; trend: number } {
  if (delta > 3) return { direction: "DoubleUp", trend: 4 };
  if (delta > 1.5) return { direction: "SingleUp", trend: 3 };
  if (delta > 0.5) return { direction: "FortyFiveUp", trend: 2 };
  if (delta < -3) return { direction: "DoubleDown", trend: -4 };
  if (delta < -1.5) return { direction: "SingleDown", trend: -3 };
  if (delta < -0.5) return { direction: "FortyFiveDown", trend: -2 };
  return { direction: "Flat", trend: 0 };
}

export function generateDemoEntries(from: number, to: number): NightscoutEntry[] {
  const entries: NightscoutEntry[] = [];
  const intervalMs = 5 * 60 * 1000;
  const rand = seededRandom(42);

  let prevSgv = 120;
  let id = 0;

  for (let ts = from; ts <= to; ts += intervalMs) {
    const d = new Date(ts);
    const hour = d.getHours();
    const minute = d.getMinutes();
    const target = glucoseAtHour(hour, minute);
    const noise = (rand() - 0.5) * 12;
    const sgv = Math.round(Math.max(55, Math.min(280, target + noise + (prevSgv - target) * 0.3)));
    const delta = sgv - prevSgv;
    const { direction, trend } = trendFromDelta(delta);

    entries.push({
      _id: `demo-entry-${id++}`,
      date: ts,
      sgv,
      direction,
      trend,
      device: "Demo CGM",
      type: "sgv",
    });
    prevSgv = sgv;
  }

  return entries;
}

function makeTreatment(
  id: number,
  eventType: string,
  ts: number,
  extra: Partial<NightscoutTreatment> = {}
): NightscoutTreatment {
  const iso = new Date(ts).toISOString();
  return {
    _id: `demo-treatment-${id}`,
    eventType,
    created_at: iso,
    timestamp: String(ts),
    date: iso,
    duration: 0,
    enteredBy: "Demo",
    ...extra,
  };
}

export function generateDemoTreatments(from: number, to: number): NightscoutTreatment[] {
  const treatments: NightscoutTreatment[] = [];
  let id = 0;

  const dayStart = new Date(from);
  dayStart.setHours(0, 0, 0, 0);

  for (let day = dayStart.getTime(); day <= to; day += 86400000) {
    const meals = [
      { h: 7, m: 45, carbs: 45, insulin: 4.5 },
      { h: 12, m: 30, carbs: 60, insulin: 6 },
      { h: 19, m: 0, carbs: 50, insulin: 5 },
    ];

    for (const meal of meals) {
      const ts = new Date(day);
      ts.setHours(meal.h, meal.m, 0, 0);
      if (ts.getTime() < from || ts.getTime() > to) continue;

      treatments.push(
        makeTreatment(id++, "Meal Bolus", ts.getTime(), {
          carbs: meal.carbs,
          insulin: meal.insulin,
          notes: "Repas demo",
        })
      );
    }

    // Correction bolus occasionnelle
    const dayIndex = Math.floor((day - dayStart.getTime()) / 86400000);
    if (dayIndex % 3 === 1) {
      const ts = new Date(day);
      ts.setHours(15, 20, 0, 0);
      if (ts.getTime() >= from && ts.getTime() <= to) {
        treatments.push(
          makeTreatment(id++, "Correction Bolus", ts.getTime(), {
            insulin: 1.2,
            glucose: 210,
            glucoseType: "Finger",
            units: "mg/dl",
          })
        );
      }
    }

    // Temp basal
    if (dayIndex % 4 === 2) {
      const ts = new Date(day);
      ts.setHours(22, 0, 0, 0);
      if (ts.getTime() >= from && ts.getTime() <= to) {
        treatments.push(
          makeTreatment(id++, "Temp Basal", ts.getTime(), {
            duration: 120,
            rate: 0.8,
            absolute: 0.8,
            percent: 80,
          })
        );
      }
    }

    // Lecture capillaire
    const fingerTs = new Date(day);
    fingerTs.setHours(8, 0, 0, 0);
    if (fingerTs.getTime() >= from && fingerTs.getTime() <= to) {
      treatments.push(
        makeTreatment(id++, "BG Check", fingerTs.getTime(), {
          glucose: 118 + (dayIndex % 5) * 8,
          glucoseType: "Finger",
          units: "mg/dl",
        })
      );
    }
  }

  return treatments;
}

export function generateDemoProfile(): NightscoutProfile {
  return {
    _id: "demo-profile",
    defaultProfile: "Demo",
    store: {
      Demo: {
        dia: 4,
        carbs_hr: 20,
        delay: 20,
        timezone: "Europe/Paris",
        startDate: "2020-01-01T00:00:00.000Z",
        mills: Date.now(),
        units: "mg/dl",
        carbratio: [
          { time: "00:00", value: 10, timeAsSeconds: 0 },
          { time: "06:00", value: 8, timeAsSeconds: 21600 },
          { time: "12:00", value: 10, timeAsSeconds: 43200 },
          { time: "18:00", value: 9, timeAsSeconds: 64800 },
        ],
        sens: [
          { time: "00:00", value: 50, timeAsSeconds: 0 },
          { time: "06:00", value: 45, timeAsSeconds: 21600 },
          { time: "12:00", value: 50, timeAsSeconds: 43200 },
        ],
        basal: [
          { time: "00:00", value: 0.8, timeAsSeconds: 0 },
          { time: "03:00", value: 0.9, timeAsSeconds: 10800 },
          { time: "06:00", value: 1.0, timeAsSeconds: 21600 },
          { time: "09:00", value: 0.85, timeAsSeconds: 32400 },
          { time: "12:00", value: 0.8, timeAsSeconds: 43200 },
          { time: "18:00", value: 0.75, timeAsSeconds: 64800 },
          { time: "22:00", value: 0.7, timeAsSeconds: 79200 },
        ],
        target_low: [
          { time: "00:00", value: 80, timeAsSeconds: 0 },
        ],
        target_high: [
          { time: "00:00", value: 180, timeAsSeconds: 0 },
        ],
      },
    },
  };
}
