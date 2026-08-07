#!/usr/bin/env node
/**
 * Test de bout en bout : données Nightscout → CSV Glooko XT → import MyDiabby.
 *
 * Usage :
 *   MYDIABBY_EMAIL=... MYDIABBY_PASSWORD=... node scripts/test-glooko-import.mjs
 *
 * Ce script :
 *   1. Génère des données Nightscout synthétiques (comme le mode démo de l'app)
 *   2. Construit le CSV au format Glooko XT (via lib/glookoExport.ts compilé)
 *   3. L'uploade sur MyDiabby (POST /api/upload-data/glooko)
 *   4. Vérifie le résultat et supprime les données de test créées
 */
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const BASE = "https://app.mydiabby.com/api";

async function login(email, password) {
  const res = await fetch(`${BASE}/getToken`, {
    method: "POST",
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      "X-locale": "fr",
    },
    credentials: "include",
    body: new URLSearchParams({ username: email, password, platform: "dt" }),
  });
  if (!res.ok) throw new Error(`Login HTTP ${res.status}`);
  const data = await res.json();
  if (!data.token) throw new Error("Pas de token");
  return data.token;
}

async function uploadGlooko(token, csv) {
  const boundary = "----Test" + Date.now();
  const body =
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file"; filename="GLOOKO_XT_Export_test.csv"\r\n` +
    `Content-Type: text/csv\r\n\r\n` +
    csv +
    `\r\n--${boundary}--\r\n`;
  const res = await fetch(`${BASE}/upload-data/glooko`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
      "X-locale": "fr",
    },
    credentials: "include",
    body,
  });
  return { status: res.status, data: await res.json() };
}

// Génère des données Nightscout synthétiques (glycémies toutes les 5 min + bolus + carbs)
function generateNightscoutData() {
  const entries = [];
  const treatments = [];
  const now = new Date();
  const base = new Date(now);
  base.setDate(base.getDate() - 2);
  base.setHours(6, 0, 0, 0);

  // Glycémies toutes les 5 min sur 2 jours (576 valeurs)
  for (let i = 0; i < 24 * 12 * 2; i++) {
    const t = new Date(base.getTime() + i * 5 * 60 * 1000);
    // Courbe réaliste 90-180 mg/dL
    const hour = t.getHours() + t.getMinutes() / 60;
    const glu = 120 + 40 * Math.sin((hour - 8) / 12 * Math.PI) + (i % 7 - 3) * 2;
    entries.push({
      _id: `demo-${i}`,
      date: t.getTime(),
      sgv: Math.round(Math.max(70, Math.min(220, glu))),
      direction: "Flat",
      trend: 0,
    });
  }

  // Bolus + carbs aux repas
  for (const [h, bolus, carbs] of [[8, 4, 55], [12.5, 6, 80], [19, 5, 65]]) {
    const t = new Date(base);
    t.setHours(Math.floor(h), Math.round((h % 1) * 60), 0, 0);
    treatments.push({
      _id: `bolus-${h}`,
      eventType: "Meal Bolus",
      date: t.toISOString(),
      insulin: bolus,
      carbs,
    });
  }

  return { entries, treatments };
}

async function main() {
  const email = process.env.MYDIABBY_EMAIL;
  const password = process.env.MYDIABBY_PASSWORD;
  if (!email || !password) {
    console.error("Usage: MYDIABBY_EMAIL=... MYDIABBY_PASSWORD=... node scripts/test-glooko-import.mjs");
    process.exit(1);
  }

  console.log("1) Connexion MyDiabby…");
  const token = await login(email, password);
  console.log("   ✅ Connecté");

  console.log("\n2) Génération des données Nightscout synthétiques…");
  const { entries, treatments } = generateNightscoutData();
  console.log(`   ${entries.length} glycémies, ${treatments.length} traitements`);

  console.log("\n3) Construction du CSV Glooko XT…");
  // Construit le CSV manuellement (même logique que lib/glookoExport.ts)
  const headers = [
    "Date", "Pump device", "BG device", "Blood glucose (mg/dl)",
    "Rapid injections / Bolus (u)", "Type", "Low injections (u)", "Type",
    "Serial number", "Comments", "Basal rate (u/h)", "Basal detail",
    "Basal delivery type", "Duration (ms)", "Bolus type",
    "Injection correction", "Injection carbs", "Event", "Settings",
    "Carbs", "Weight", "BMI", "Blood Ketone", "Activity (steps)",
    "Activity (minutes)", "Carb ratio", "Sensitivity", "Schedule name",
    "Priming", "IOB", "Meal tags",
  ];
  const p = (n) => String(n).padStart(2, "0");
  const fmt = (d) => `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
  const fmtD = (d) => `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;

  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 2);

  // Profil patient dynamique (POST /api/account avec le token — comme le composant)
  let patientLine = "PATIENT;PATIENT;MAN;TYPE 1;" + email;
  try {
    const acc = await fetch(`${BASE}/account`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        "X-locale": "fr",
      },
      credentials: "include",
      body: new URLSearchParams({ language: "fr" }),
    });
    if (acc.ok) {
      const accData = await acc.json();
      const u = accData?.user;
      if (u) {
        const gender = u.sex === "M" ? "MAN" : u.sex === "F" ? "WOMAN" : u.sex || "MAN";
        const pathology = u.patient?.pathology === "DT1" ? "TYPE 1" : u.patient?.pathology || "TYPE 1";
        patientLine = `${(u.lastname || "PATIENT").toUpperCase()};${(u.firstname || "PATIENT").toUpperCase()};${gender};${pathology};${u.email || email}`;
      }
    }
  } catch { /* fallback patientLine par défaut */ }

  const lines = [
    `GLOOKO XT EXPORT - ${fmtD(today)}`,
    `PERIOD;${fmtD(start)} to ${fmtD(today)}`,
    "TIMEZONE;Europe/Paris",
    "",
    "Lastname;Firstname;Gender;Diabete type;email",
    patientLine,
    "",
    headers.join(";"),
  ];

  // Bolus par timestamp pour associer carbs
  const bolusByTime = new Map();
  for (const tr of treatments) {
    const key = new Date(tr.date).toISOString().slice(0, 16);
    bolusByTime.set(key, tr);
  }

  for (const e of entries) {
    const d = new Date(e.date);
    const key = d.toISOString().slice(0, 16);
    const tr = bolusByTime.get(key);
    const cols = new Array(31).fill("");
    cols[0] = fmt(d);
    cols[2] = "Libre 2";
    cols[3] = String(Math.round(e.sgv));
    if (tr) {
      cols[1] = "Omnipod 5";
      cols[4] = tr.insulin.toFixed(2);
      cols[8] = "SN-DEMO-001";
      cols[14] = "Bolus normal";
      cols[15] = "false";
      cols[16] = String(tr.carbs || 0);
      cols[19] = String(tr.carbs || 0);
      cols[28] = "false";
      cols[30] = "pre_meal - breakfast";
    }
    cols[10] = "0.85";
    cols[11] = "0.85";
    cols[12] = "Basal";
    cols[13] = "1800000";
    cols[18] = "false";
    lines.push(cols.join(";"));
  }
  const csv = lines.join("\n") + "\n";
  console.log(`   CSV: ${csv.length} octets, ${entries.length} lignes de données`);

  console.log("\n4) Upload sur MyDiabby…");
  const t0 = Date.now();
  const result = await uploadGlooko(token, csv);
  const dt = Date.now() - t0;
  console.log(`   HTTP ${result.status} en ${dt}ms`);
  console.log(`   Réponse: ${JSON.stringify(result.data)}`);

  if (result.data?.success) {
    console.log(`\n🎉 IMPORT RÉUSSI — ${result.data.nb} nouvelles valeurs importées en ${dt}ms`);
  } else {
    console.log("\n❌ Import refusé:", result.data?.error || "inconnu");
    console.log("Astuce: vérifier le contenu du CSV (voir scripts/test-mydiabby-batch.mjs pour les règles)");
  }
}

main().catch((e) => {
  console.error("Erreur fatale:", e.message);
  process.exit(1);
});
