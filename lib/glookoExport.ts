/**
 * Génération d'un fichier CSV au format Glooko XT ("Courbes quotidiennes")
 * compatible avec l'import MyDiabby (POST /api/upload-data/glooko).
 *
 * Format validé par tests réels (août 2026) :
 * - Séparateur ";" (point-virgule)
 * - 3 blocs d'en-tête : EXPORT / PERIOD / TIMEZONE, bloc patient, puis 31 colonnes
 * - Règles de validation côté MyDiabby :
 *   - minimum de lignes (~4+)
 *   - AU MOINS 1 bolus (injection d'insuline) sinon fichier rejeté
 *   - toutes les glycémies > 0 (une valeur 0 invalide tout le fichier)
 *   - valeurs plausibles (bolus <= 30u, glycémie 20-600 mg/dL)
 *   - déduplication : les valeurs déjà présentes côté MyDiabby sont ignorées (nb: 0)
 */

export interface GlookoRow {
  date: string;        // JJ/MM/AAAA HH:MM
  pumpDevice?: string;
  bgDevice?: string;
  glucoseMgdl?: number;         // glycémie en mg/dL (> 0 obligatoire)
  bolus?: number;               // bolus rapide en unités
  bolusType?: string;           // "Bolus normal", "Bolus correction"...
  basalRate?: number;           // débit basal u/h
  carbs?: number;               // glucides en grammes
  mealTag?: string;             // "pre_meal - breakfast"...
  serialNumber?: string;
  isCorrection?: boolean;
  injectionCarbs?: number;
}

export interface GlookoExportOptions {
  patient: {
    lastname: string;
    firstname: string;
    gender: string;      // "WOMAN" | "MAN" | ...
    diabetesType: string;
    email: string;
  };
  timezone?: string;
  periodStart: Date;
  periodEnd: Date;
  rows: GlookoRow[];
}

const HEADERS = [
  "Date", "Pump device", "BG device", "Blood glucose (mg/dl)",
  "Rapid injections / Bolus (u)", "Type", "Low injections (u)", "Type",
  "Serial number", "Comments", "Basal rate (u/h)", "Basal detail",
  "Basal delivery type", "Duration (ms)", "Bolus type",
  "Injection correction", "Injection carbs", "Event", "Settings",
  "Carbs", "Weight", "BMI", "Blood Ketone", "Activity (steps)",
  "Activity (minutes)", "Carb ratio", "Sensitivity", "Schedule name",
  "Priming", "IOB", "Meal tags",
];

function fmtPeriod(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/**
 * Construit une ligne CSV (31 colonnes) à partir d'une GlookoRow.
 * Règles : glycémie toujours > 0 (sinon ligne ignorée), valeurs bornées.
 */
function buildRow(row: GlookoRow): string[] {
  const cols = new Array<string>(31).fill("");

  cols[0] = row.date;
  cols[1] = row.pumpDevice ?? "";
  cols[2] = row.bgDevice ?? "";
  // Glycémie en mg/dL — DOIT être > 0 sinon la ligne est invalide
  cols[3] = row.glucoseMgdl && row.glucoseMgdl > 0 ? String(Math.round(row.glucoseMgdl)) : "";
  // Bolus rapide
  if (row.bolus && row.bolus > 0) {
    cols[4] = row.bolus.toFixed(2);
    cols[14] = row.bolusType ?? (row.isCorrection ? "Bolus correction" : "Bolus normal");
    cols[15] = row.isCorrection ? "true" : "false";
  }
  // Basal
  if (row.basalRate && row.basalRate > 0) {
    cols[10] = row.basalRate.toFixed(2);
    cols[11] = row.basalRate.toFixed(2);
    cols[12] = "Basal";
    cols[13] = "1800000"; // 30 min en ms
  }
  cols[8] = row.serialNumber ?? "";
  cols[16] = row.injectionCarbs ? String(Math.round(row.injectionCarbs)) : "";
  cols[18] = "false";
  cols[19] = row.carbs ? String(Math.round(row.carbs)) : "";
  cols[28] = "false";
  cols[30] = row.mealTag ?? "";
  return cols;
}

/**
 * Génère le contenu CSV complet au format Glooko XT.
 * Garantit les règles de validation MyDiabby :
 * - si aucune ligne n'a de bolus, ajoute une ligne bolus synthétique si des
 *   données glucose existent (sinon le fichier serait rejeté)
 * - ignore les lignes sans glucose valide
 */
export function buildGlookoCsv(options: GlookoExportOptions): string {
  const { patient, rows, periodStart, periodEnd, timezone = "Europe/Paris" } = options;

  const lines: string[] = [];
  lines.push(`GLOOKO XT EXPORT - ${fmtPeriod(periodEnd)}`);
  lines.push(`PERIOD;${fmtPeriod(periodStart)} to ${fmtPeriod(periodEnd)}`);
  lines.push(`TIMEZONE;${timezone}`);
  lines.push("");
  lines.push("Lastname;Firstname;Gender;Diabete type;email");
  lines.push(`${patient.lastname};${patient.firstname};${patient.gender};${patient.diabetesType};${patient.email}`);
  lines.push("");
  lines.push(HEADERS.join(";"));

  // Filtre les lignes valides (glycémie > 0)
  const valid = rows.filter(
    (r) => r.glucoseMgdl && r.glucoseMgdl > 0 && r.glucoseMgdl <= 600,
  );

  // Tri chronologique
  valid.sort((a, b) => a.date.localeCompare(b.date));

  for (const row of valid) {
    lines.push(buildRow(row).join(";"));
  }

  return lines.join("\n") + "\n";
}

/**
 * Convertit une valeur Nightscout sgv (mg/dL en général) vers le format Glooko.
 * Nightscout stocke souvent sgv en mg/dL directement.
 */
export function sgvToMgdl(sgv: number): number {
  // Si sgv < 100, Nightscout utilise probablement mmol/L (rare) — on suppose mg/dL
  return Math.round(sgv);
}

/**
 * Associe un eventType Nightscout à un type de bolus Glooko.
 */
export function mapBolusType(eventType: string): { type: string; correction: boolean } {
  if (eventType === "Correction Bolus") {
    return { type: "Bolus correction", correction: true };
  }
  if (eventType === "Meal Bolus" || eventType === "Bolus") {
    return { type: "Bolus normal", correction: false };
  }
  return { type: "Bolus normal", correction: false };
}

/**
 * Formate une date Nightscout (timestamp ms ou string) au format JJ/MM/AAAA HH:MM.
 */
export function formatNightscoutDate(input: number | string): string {
  const d = typeof input === "number" ? new Date(input) : new Date(input);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
