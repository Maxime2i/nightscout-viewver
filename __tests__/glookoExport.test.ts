import { describe, it, expect } from "vitest";
import {
  buildGlookoCsv,
  sgvToMgdl,
  mapBolusType,
  formatNightscoutDate,
  type GlookoRow,
  type GlookoExportOptions,
} from "../lib/glookoExport";

const HEADER_COL_COUNT = 31;

function makeOptions(rows: GlookoRow[]): GlookoExportOptions {
  return {
    patient: {
      lastname: "Doe",
      firstname: "John",
      gender: "MAN",
      diabetesType: "Type 1",
      email: "john.doe@example.com",
    },
    timezone: "Europe/Paris",
    periodStart: new Date(2026, 7, 1), // 01/08/2026
    periodEnd: new Date(2026, 7, 7), // 07/08/2026
    rows,
  };
}

function dataLines(csv: string): string[] {
  // Les lignes de données commencent après la ligne d'en-tête (index 7)
  return csv.split("\n").slice(8).filter((l) => l.length > 0);
}

function splitRow(line: string): string[] {
  return line.split(";");
}

describe("buildGlookoCsv", () => {
  it("génère les blocs d'en-tête Glooko XT", () => {
    const csv = buildGlookoCsv(makeOptions([]));
    const lines = csv.split("\n");
    expect(lines[0]).toBe("GLOOKO XT EXPORT - 07/08/2026");
    expect(lines[1]).toBe("PERIOD;01/08/2026 to 07/08/2026");
    expect(lines[2]).toBe("TIMEZONE;Europe/Paris");
    expect(lines[3]).toBe("");
    expect(lines[4]).toBe("Lastname;Firstname;Gender;Diabete type;email");
    expect(lines[5]).toBe("Doe;John;MAN;Type 1;john.doe@example.com");
    expect(lines[6]).toBe("");
    expect(lines[7].split(";")).toHaveLength(HEADER_COL_COUNT);
    expect(lines[7].split(";")[0]).toBe("Date");
    expect(lines[7].split(";")[3]).toBe("Blood glucose (mg/dl)");
    // Terminaison par newline
    expect(csv.endsWith("\n")).toBe(true);
  });

  it("utilise le fuseau horaire par défaut Europe/Paris quand absent", () => {
    const opts = makeOptions([]);
    delete opts.timezone;
    const csv = buildGlookoCsv(opts);
    expect(csv.split("\n")[2]).toBe("TIMEZONE;Europe/Paris");
  });

  it("écrit une ligne de données complète (31 colonnes)", () => {
    const csv = buildGlookoCsv(
      makeOptions([
        {
          date: "07/08/2026 08:30",
          glucoseMgdl: 126,
          bolus: 2.5,
          bolusType: "Bolus normal",
          basalRate: 0.8,
          carbs: 45,
          mealTag: "pre_meal - breakfast",
          serialNumber: "SN123",
          injectionCarbs: 10,
        },
      ]),
    );
    const cols = splitRow(dataLines(csv)[0]);
    expect(cols).toHaveLength(HEADER_COL_COUNT);
    expect(cols[0]).toBe("07/08/2026 08:30");
    expect(cols[3]).toBe("126");
    expect(cols[4]).toBe("2.50"); // bolus avec 2 décimales
    expect(cols[14]).toBe("Bolus normal");
    expect(cols[15]).toBe("false");
    expect(cols[10]).toBe("0.80"); // basal avec 2 décimales
    expect(cols[11]).toBe("0.80");
    expect(cols[12]).toBe("Basal");
    expect(cols[13]).toBe("1800000");
    expect(cols[8]).toBe("SN123");
    expect(cols[16]).toBe("10");
    expect(cols[18]).toBe("false");
    expect(cols[19]).toBe("45");
    expect(cols[28]).toBe("false");
    expect(cols[30]).toBe("pre_meal - breakfast");
  });

  it("écrit un bolus de correction avec type et flag true", () => {
    const csv = buildGlookoCsv(
      makeOptions([
        {
          date: "07/08/2026 12:00",
          glucoseMgdl: 150,
          bolus: 1.2,
          isCorrection: true,
        },
      ]),
    );
    const cols = splitRow(dataLines(csv)[0]);
    expect(cols[14]).toBe("Bolus correction");
    expect(cols[15]).toBe("true");
  });

  it("laisse les champs absents vides mais conserve la ligne si glucose valide", () => {
    const csv = buildGlookoCsv(
      makeOptions([
        { date: "07/08/2026 18:00", glucoseMgdl: 100 },
      ]),
    );
    const cols = splitRow(dataLines(csv)[0]);
    expect(cols).toHaveLength(HEADER_COL_COUNT);
    expect(cols[3]).toBe("100");
    expect(cols[4]).toBe(""); // pas de bolus
    expect(cols[10]).toBe(""); // pas de basal
    expect(cols[14]).toBe("");
    expect(cols[19]).toBe(""); // pas de carbs
  });

  it("ignore les lignes sans glycémie, avec glycémie 0 ou > 600", () => {
    const csv = buildGlookoCsv(
      makeOptions([
        { date: "07/08/2026 08:00", glucoseMgdl: 180 }, // valide
        { date: "07/08/2026 09:00", glucoseMgdl: 0 }, // invalide (0)
        { date: "07/08/2026 10:00", glucoseMgdl: 601 }, // invalide (> 600)
        { date: "07/08/2026 11:00" }, // invalide (absente)
        { date: "07/08/2026 12:00", glucoseMgdl: 600 }, // valide (borne haute incluse)
        { date: "07/08/2026 13:00", glucoseMgdl: 20 }, // valide (borne basse ok)
      ]),
    );
    const lines = dataLines(csv);
    expect(lines).toHaveLength(3);
    expect(splitRow(lines[0])[3]).toBe("180");
    expect(splitRow(lines[1])[3]).toBe("600");
    expect(splitRow(lines[2])[3]).toBe("20");
  });

  it("trie les lignes chronologiquement par date", () => {
    const csv = buildGlookoCsv(
      makeOptions([
        { date: "07/08/2026 10:00", glucoseMgdl: 100 },
        { date: "07/08/2026 08:00", glucoseMgdl: 80 },
        { date: "06/08/2026 22:00", glucoseMgdl: 90 },
        { date: "07/08/2026 09:00", glucoseMgdl: 95 },
      ]),
    );
    const dates = dataLines(csv).map((l) => splitRow(l)[0]);
    expect(dates).toEqual([
      "06/08/2026 22:00",
      "07/08/2026 08:00",
      "07/08/2026 09:00",
      "07/08/2026 10:00",
    ]);
  });

  it("n'écrit pas de bolus quand la valeur est 0 (falsy)", () => {
    const csv = buildGlookoCsv(
      makeOptions([
        { date: "07/08/2026 08:00", glucoseMgdl: 120, bolus: 0 },
      ]),
    );
    const cols = splitRow(dataLines(csv)[0]);
    expect(cols[4]).toBe("");
    expect(cols[14]).toBe("");
  });

  it("arrondit la glycémie à l'entier le plus proche", () => {
    const csv = buildGlookoCsv(
      makeOptions([
        { date: "07/08/2026 08:00", glucoseMgdl: 126.7 },
        { date: "07/08/2026 09:00", glucoseMgdl: 126.4 },
      ]),
    );
    const lines = dataLines(csv);
    expect(splitRow(lines[0])[3]).toBe("127");
    expect(splitRow(lines[1])[3]).toBe("126");
  });

  it("arrondit carbs et injectionCarbs, et traite 0 comme absent", () => {
    const csv = buildGlookoCsv(
      makeOptions([
        {
          date: "07/08/2026 08:00",
          glucoseMgdl: 120,
          carbs: 45.6,
          injectionCarbs: 12.4,
        },
        {
          date: "07/08/2026 09:00",
          glucoseMgdl: 130,
          carbs: 0,
          injectionCarbs: 0,
        },
      ]),
    );
    const lines = dataLines(csv);
    expect(splitRow(lines[0])[19]).toBe("46"); // Math.round(45.6)
    expect(splitRow(lines[0])[16]).toBe("12"); // Math.round(12.4)
    expect(splitRow(lines[1])[19]).toBe(""); // 0 → falsy → vide
    expect(splitRow(lines[1])[16]).toBe("");
  });
});

describe("sgvToMgdl", () => {
  it("arrondit la valeur sgv à l'entier", () => {
    expect(sgvToMgdl(180)).toBe(180);
    expect(sgvToMgdl(180.4)).toBe(180);
    expect(sgvToMgdl(180.5)).toBe(181);
    expect(sgvToMgdl(0)).toBe(0);
    expect(sgvToMgdl(-5.2)).toBe(-5);
  });
});

describe("mapBolusType", () => {
  it("mappe Correction Bolus vers un bolus de correction", () => {
    expect(mapBolusType("Correction Bolus")).toEqual({
      type: "Bolus correction",
      correction: true,
    });
  });

  it("mappe Meal Bolus et Bolus vers un bolus normal", () => {
    expect(mapBolusType("Meal Bolus")).toEqual({
      type: "Bolus normal",
      correction: false,
    });
    expect(mapBolusType("Bolus")).toEqual({
      type: "Bolus normal",
      correction: false,
    });
  });

  it("retombe sur un bolus normal pour un type inconnu", () => {
    expect(mapBolusType("Snack Bolus")).toEqual({
      type: "Bolus normal",
      correction: false,
    });
  });
});

describe("formatNightscoutDate", () => {
  it("formate un timestamp en JJ/MM/AAAA HH:MM", () => {
    const ts = new Date(2026, 7, 7, 9, 5).getTime();
    expect(formatNightscoutDate(ts)).toBe("07/08/2026 09:05");
  });

  it("formate une chaîne de date", () => {
    expect(formatNightscoutDate("2026-01-05T09:07:00")).toBe("05/01/2026 09:07");
  });

  it("padde jour, mois, heure et minute", () => {
    expect(formatNightscoutDate(new Date(2026, 0, 5, 9, 7).getTime())).toBe(
      "05/01/2026 09:07",
    );
    expect(formatNightscoutDate(new Date(2026, 11, 31, 23, 59).getTime())).toBe(
      "31/12/2026 23:59",
    );
  });
});
