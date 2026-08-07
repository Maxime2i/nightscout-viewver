#!/usr/bin/env node
/**
 * Test batch MyDiabby — vérifie si l'API accepte plusieurs glycémies dans un seul POST.
 *
 * Usage :
 *   MYDIABBY_EMAIL=... MYDIABBY_PASSWORD=... node scripts/test-mydiabby-batch.mjs
 *
 * Ce script :
 *   1. Se connecte à MyDiabby (getToken)
 *   2. Envoie 1 glycémie (témoin) — doit réussir
 *   3. Tente un POST groupé avec 2 glycémies en un seul appel
 *   4. Affiche les résultats — si l'étape 3 réussit, le batch est possible
 *
 * ⚠️ Les données envoyées sont factices (valeurs ~5.5 mmol/L, dates du jour).
 *    Supprime-les depuis l'interface MyDiabby après le test si besoin.
 */

const BASE = "https://app.mydiabby.com/api";

function formBody(params) {
  return new URLSearchParams(params).toString();
}

async function login(email, password) {
  const res = await fetch(`${BASE}/getToken`, {
    method: "POST",
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      "X-locale": "fr",
    },
    credentials: "include",
    body: formBody({ username: email, password, platform: "dt" }),
  });
  if (!res.ok) throw new Error(`Login HTTP ${res.status}`);
  const data = await res.json();
  if (!data.token) throw new Error("Pas de token dans la réponse login");
  return data.token;
}

function nowParts() {
  const d = new Date();
  const date = d.toISOString().slice(0, 10);
  const time = d.toTimeString().slice(0, 5);
  return { date, time };
}

const headers = (token) => ({
  Accept: "application/json, text/plain, */*",
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
  "X-locale": "fr",
});

async function sendOne(token, { date, time, value }) {
  const res = await fetch(`${BASE}/data`, {
    method: "POST",
    headers: headers(token),
    credentials: "include",
    body: formBody({
      time, date, add: "true", dgnew: "false",
      "glycemia[value]": value,
      "glycemia[typemeal]": "1",
      "glycemia[pp]": "false",
      "glycemia[idsurvey]": "2",
    }),
  });
  return { status: res.status, body: await res.text() };
}

// Variantes de payload groupé à tester
async function sendBatchVariants(token, { date, time }) {
  const variants = [
    {
      name: "tableau glycemia[0..1]",
      params: {
        time, date, add: "true", dgnew: "false",
        "glycemia[0][value]": "5.5000",
        "glycemia[0][typemeal]": "1",
        "glycemia[1][value]": "6.1000",
        "glycemia[1][typemeal]": "1",
      },
    },
    {
      name: "doublon de clés glycemia[value] (2x)",
      params: [
        ["time", time], ["date", date], ["add", "true"], ["dgnew", "false"],
        ["glycemia[value]", "5.5000"], ["glycemia[typemeal]", "1"],
        ["glycemia[value]", "6.1000"], ["glycemia[typemeal]", "1"],
      ],
    },
    {
      name: "JSON body data[]",
      json: true,
      payload: {
        add: "true",
        dgnew: "false",
        data: [
          { time, date, glycemia: { value: "5.5000", typemeal: "1", pp: "false", idsurvey: "2" } },
          { time, date, glycemia: { value: "6.1000", typemeal: "1", pp: "false", idsurvey: "2" } },
        ],
      },
    },
  ];

  for (const v of variants) {
    try {
      const res = await fetch(`${BASE}/data`, {
        method: "POST",
        headers: v.json
          ? { ...headers(token), "Content-Type": "application/json" }
          : headers(token),
        credentials: "include",
        body: v.json ? JSON.stringify(v.payload) : new URLSearchParams(v.params).toString(),
      });
      const text = await res.text();
      console.log(`\n[${v.name}] HTTP ${res.status}`);
      console.log(`  Réponse: ${text.slice(0, 300)}`);
      console.log(`  → ${res.ok ? "✅ BATCH POSSIBLE" : "❌ refusé (attendu si pas de support batch)"}`);
    } catch (e) {
      console.log(`\n[${v.name}] ERREUR: ${e.message}`);
    }
  }
}

async function main() {
  const email = process.env.MYDIABBY_EMAIL;
  const password = process.env.MYDIABBY_PASSWORD;
  if (!email || !password) {
    console.error("Usage: MYDIABBY_EMAIL=... MYDIABBY_PASSWORD=... node scripts/test-mydiabby-batch.mjs");
    process.exit(1);
  }

  console.log("1) Connexion…");
  const token = await login(email, password);
  console.log("   ✅ Connecté");

  console.log("\n2) Envoi témoin (1 glycémie)…");
  const { date, time } = nowParts();
  const witness = await sendOne(token, { date, time, value: "5.5000" });
  console.log(`   HTTP ${witness.status}: ${witness.body.slice(0, 200)}`);

  console.log("\n3) Tests de batch…");
  await sendBatchVariants(token, { date, time });

  console.log("\nConclusion: si une variante de l'étape 3 répond OK, on peut implémenter l'envoi groupé.");
}

main().catch((e) => {
  console.error("Erreur fatale:", e.message);
  process.exit(1);
});
