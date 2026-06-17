import { NextRequest, NextResponse } from "next/server";
import {
  NightscoutEntry,
  NightscoutTreatment,
  NightscoutProfile,
} from "@/types/nightscout";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const TARGET_LOW = 70;
const TARGET_HIGH = 180;
const HYPER_THRESHOLD = 180;
const HYPO_THRESHOLD = 70;

// Créneaux de 3h pour repérer les horaires à risque
const TIME_SLOTS = [
  { start: 0, end: 3, label: "00h-03h (nuit)" },
  { start: 3, end: 6, label: "03h-06h (fin nuit)" },
  { start: 6, end: 9, label: "06h-09h (matin)" },
  { start: 9, end: 12, label: "09h-12h (avant-midi)" },
  { start: 12, end: 15, label: "12h-15h (midi)" },
  { start: 15, end: 18, label: "15h-18h (après-midi)" },
  { start: 18, end: 21, label: "18h-21h (soirée)" },
  { start: 21, end: 24, label: "21h-00h (soir)" },
];

function getHour(date: Date): number {
  return date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
}

function formatProfileForPrompt(profile: NightscoutProfile | null): string {
  if (!profile?.store || !profile.defaultProfile) return "";
  const p = profile.store[profile.defaultProfile];
  if (!p) return "";
  let out =
    "\nProfil Nightscout actuel (à utiliser pour proposer des modifications précises) :\n";
  if (p.basal?.length) {
    out += "Basale (débit U/h par plage) :\n";
    p.basal.forEach((b) => {
      out += `  - à ${b.time} : ${b.value} U/h\n`;
    });
  }
  if (p.carbratio?.length) {
    out += "Ratio glucides (g de glucides pour 1 U, par plage) :\n";
    p.carbratio.forEach((c) => {
      out += `  - à ${c.time} : 1 U pour ${c.value} g\n`;
    });
  }
  if (p.sens?.length) {
    out +=
      "Sensibilité / facteur de correction (baisse en mg/dL pour 1 U, par plage) :\n";
    p.sens.forEach((s) => {
      out += `  - à ${s.time} : ${s.value} ${
        p.units === "mmol" ? "mmol/L" : "mg/dL"
      } pour 1 U\n`;
    });
  }
  return out;
}

function buildSummary(
  entries: NightscoutEntry[],
  treatments: NightscoutTreatment[],
  unit: string,
  profile: NightscoutProfile | null
) {
  const periodEntries = entries.filter((e) => e.sgv != null);
  const periodTreatments = treatments;

  const entriesByDay = new Map<string, NightscoutEntry[]>();
  const treatmentsByDay = new Map<string, NightscoutTreatment[]>();
  for (const e of periodEntries) {
    const dayKey = format(new Date(e.date), "yyyy-MM-dd");
    if (!entriesByDay.has(dayKey)) entriesByDay.set(dayKey, []);
    entriesByDay.get(dayKey)!.push(e);
  }
  for (const t of periodTreatments) {
    const d = new Date(t.date || t.created_at || t.timestamp);
    const dayKey = format(d, "yyyy-MM-dd");
    if (!treatmentsByDay.has(dayKey)) treatmentsByDay.set(dayKey, []);
    treatmentsByDay.get(dayKey)!.push(t);
  }

  const sortedDayKeys = Array.from(entriesByDay.keys()).sort();
  const byDay: Record<
    string,
    {
      date: string;
      min: number;
      max: number;
      avg: number;
      count: number;
      inRange: number;
      below: number;
      above: number;
      carbs: number;
      bolus: number;
    }
  > = {};

  for (const dayKey of sortedDayKeys) {
    const dayEntries = entriesByDay.get(dayKey) ?? [];
    const dayTreatments = treatmentsByDay.get(dayKey) ?? [];
    const day = new Date(dayKey);

    const sgvValues = dayEntries
      .map((e) => e.sgv)
      .filter((v) => typeof v === "number");
    const min = sgvValues.length ? Math.min(...sgvValues) : 0;
    const max = sgvValues.length ? Math.max(...sgvValues) : 0;
    const avg = sgvValues.length
      ? sgvValues.reduce((a, b) => a + b, 0) / sgvValues.length
      : 0;
    const inRange = sgvValues.filter(
      (v) => v >= TARGET_LOW && v <= TARGET_HIGH
    ).length;
    const below = sgvValues.filter((v) => v < HYPO_THRESHOLD).length;
    const above = sgvValues.filter((v) => v > HYPER_THRESHOLD).length;
    const carbs = dayTreatments.reduce((s, t) => s + (t.carbs ?? 0), 0);
    const bolus = dayTreatments.reduce((s, t) => s + (t.insulin ?? 0), 0);

    byDay[dayKey] = {
      date: format(day, "EEEE d MMMM", { locale: fr }),
      min,
      max,
      avg: Math.round(avg * 10) / 10,
      count: sgvValues.length,
      inRange,
      below,
      above,
      carbs,
      bolus,
    };
  }

  const totalReadings = periodEntries.length;
  const totalInRange = periodEntries.filter(
    (e) => e.sgv >= TARGET_LOW && e.sgv <= TARGET_HIGH
  ).length;
  const totalBelow = periodEntries.filter((e) => e.sgv < HYPO_THRESHOLD).length;
  const totalAbove = periodEntries.filter(
    (e) => e.sgv > HYPER_THRESHOLD
  ).length;
  const overallAvg =
    periodEntries.length > 0
      ? periodEntries.reduce((a, e) => a + e.sgv, 0) / periodEntries.length
      : 0;
  const timeInRangePct =
    totalReadings > 0 ? (totalInRange / totalReadings) * 100 : 0;
  const hypoPct = totalReadings > 0 ? (totalBelow / totalReadings) * 100 : 0;
  const hyperPct = totalReadings > 0 ? (totalAbove / totalReadings) * 100 : 0;

  let text = `Résumé glycémique des 7 derniers jours (unité: ${unit}).\n\n`;
  text += `Sur la période : ${totalReadings} mesures, moyenne ${
    Math.round(overallAvg * 10) / 10
  } ${unit}, temps dans la cible (70-180 ${unit}) : ${timeInRangePct.toFixed(
    1
  )}%, hypoglycémies (<70) : ${hypoPct.toFixed(
    1
  )}%, hyperglycémies (>180) : ${hyperPct.toFixed(1)}%.\n\n`;

  text +=
    "Par créneau horaire (repère les horaires où les problèmes se répètent) :\n";
  for (const slot of TIME_SLOTS) {
    const inSlot = periodEntries.filter((e) => {
      const h = getHour(new Date(e.date));
      const inRange =
        h >= slot.start && (slot.end === 24 ? h < 24 : h < slot.end);
      return inRange && e.sgv != null;
    });
    const sgv = inSlot.map((e) => e.sgv as number);
    const n = sgv.length;
    const avgSlot = n ? sgv.reduce((a, b) => a + b, 0) / n : 0;
    const inRangeSlot = sgv.filter(
      (v) => v >= TARGET_LOW && v <= TARGET_HIGH
    ).length;
    const belowSlot = sgv.filter((v) => v < HYPO_THRESHOLD).length;
    const aboveSlot = sgv.filter((v) => v > HYPER_THRESHOLD).length;
    const tirPct = n ? (inRangeSlot / n) * 100 : 0;
    const hypoPctSlot = n ? (belowSlot / n) * 100 : 0;
    const hyperPctSlot = n ? (aboveSlot / n) * 100 : 0;
    const flag =
      hypoPctSlot >= 15
        ? " [BEAUCOUP D'HYPOS]"
        : hyperPctSlot >= 25
        ? " [BEAUCOUP D'HYPERS]"
        : tirPct < 50 && n >= 5
        ? " [HORS CIBLE]"
        : "";
    text += `- ${slot.label}: ${n} mesures, moyenne ${
      Math.round(avgSlot * 10) / 10
    } ${unit}, ${tirPct.toFixed(0)}% dans la cible, ${hypoPctSlot.toFixed(
      0
    )}% hypo, ${hyperPctSlot.toFixed(0)}% hyper${flag}\n`;
  }

  text += "\nPar jour :\n";
  Object.values(byDay).forEach((day) => {
    const tir =
      day.count > 0 ? ((day.inRange / day.count) * 100).toFixed(0) : "0";
    text += `- ${day.date}: min ${day.min}, max ${day.max}, moyenne ${day.avg}, ${day.count} mesures, ${tir}% dans la cible, ${day.below} hypo, ${day.above} hyper. Glucides: ${day.carbs}g, bolus: ${day.bolus} U.\n`;
  });

  const profileBlock = formatProfileForPrompt(profile);
  if (profileBlock) text += profileBlock;

  return text;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      entries,
      treatments,
      unit = "mg/dL",
      profile: profileRaw = null,
    } = body as {
      entries: NightscoutEntry[];
      treatments?: NightscoutTreatment[];
      unit?: string;
      profile?: NightscoutProfile | NightscoutProfile[] | null;
    };
    const profile: NightscoutProfile | null = Array.isArray(profileRaw)
      ? profileRaw[0] ?? null
      : profileRaw ?? null;

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json(
        { error: "Données glycémiques (entries) requises pour l'analyse." },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Analyse IA non configurée (OPENAI_API_KEY manquant). Configure la clé API OpenAI dans les variables d'environnement.",
        },
        { status: 503 }
      );
    }

    const summary = buildSummary(
      entries,
      treatments ?? [],
      unit,
      profile ?? null
    );

    const systemPrompt = `Tu es un expert en diabète et en réglage des pompes à insuline / profils Nightscout (basale, ratio glucides, sensibilité).
Tu réponds toujours en français, de façon factuelle et bienveillante.
Tu dois donner des conseils PRÉCIS et PERSONNALISÉS : horaires exacts où les problèmes se répètent, et modifications concrètes du profil (basale, ratio, sensibilité) avec les plages horaires et des ordres de grandeur (ex: "augmenter la basale de 12h à 18h d'environ 10%", "réduire le ratio glucides à 8h de 12 à 10 g/U").`;

    const userPrompt = `Voici le résumé des 7 derniers jours avec des statistiques PAR CRÉNEAU HORAIRE (pour repérer les horaires à risque) et par jour. Un profil Nightscout actuel est fourni si disponible.

${summary}

Réponds en 3 parties claires :

1) HORAIRES À RISQUE  
   En t'appuyant sur les créneaux horaires (00h-03h, 06h-09h, etc.), indique PRÉCISÉMENT à quels moments les hypoglycémies et les hyperglycémies se répètent le plus (ex: "hypoglycémies récurrentes entre 03h et 06h", "pics après le déjeuner 12h-15h"). Cite les pourcentages du résumé pour justifier.

2) MODIFICATIONS DU PROFIL INSULINE (basale, ratio, sensibilité)  
   Si le profil actuel est fourni, propose des ajustements CONCRETS avec les plages horaires et les valeurs actuelles :
   - Basale : quelle plage modifier, valeur actuelle, suggestion (ex: "Basale 12h-18h : passer de 0.8 à 0.9 U/h").
   - Ratio glucides : pour quel créneau (petit-déj, déj, dîner), valeur actuelle, suggestion (ex: "Ratio à 8h : de 12 à 10 g/U pour mieux couvrir le matin").
   - Sensibilité / facteur de correction : si pertinent, avec plage et ordre de grandeur.
   Si pas de profil fourni, donne des pistes générales par créneau horaire identifié.

3) AUTRES PISTES (timing des bolus, collations, activité, etc.) si pertinent.

Sois précis sur les horaires et les chiffres. Évite les conseils vagues.`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 1200,
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const message = err?.error?.message || `OpenAI: ${res.status}`;
      return NextResponse.json(
        { error: `Erreur lors de l'appel à l'IA: ${message}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return NextResponse.json(
        { error: "Réponse vide de l'IA." },
        { status: 502 }
      );
    }

    return NextResponse.json({ analysis: content });
  } catch (e) {
    console.error("[api/ai-analysis]", e);
    return NextResponse.json(
      { error: "Erreur lors de l'analyse des données." },
      { status: 500 }
    );
  }
}
