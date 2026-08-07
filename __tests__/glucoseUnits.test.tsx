// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import {
  GlucoseUnitsProvider,
  useGlucoseUnits,
} from "../lib/glucoseUnits";

// RTL ne s'auto-nettoie pas quand vitest tourne sans globals:true ;
// on vide le DOM après chaque test pour éviter les doublons entre tests.
afterEach(() => {
  cleanup();
});

/**
 * Harness de test : expose les fonctions du contexte via des éléments DOM
 * pour pouvoir les observer et piloter setUnit sans modifier le code source.
 */
function Harness() {
  const { unit, setUnit, convertGlucose, formatGlucose, convertRange } =
    useGlucoseUnits();
  return (
    <div>
      <span data-testid="unit">{unit}</span>
      <button onClick={() => setUnit("mmol/L")}>to-mmol</button>
      <button onClick={() => setUnit("mg/dL")}>to-mgdl</button>
      <span data-testid="convert-180">{convertGlucose(180)}</span>
      <span data-testid="convert-70">{convertGlucose(70)}</span>
      <span data-testid="convert-0">{convertGlucose(0)}</span>
      <span data-testid="format-180">{formatGlucose(180)}</span>
      <span data-testid="format-100">{formatGlucose(100)}</span>
      <span data-testid="format-5">{formatGlucose(5)}</span>
      <span data-testid="format-0">{formatGlucose(0)}</span>
      <span data-testid="format-180.4">{formatGlucose(180.4)}</span>
      <span data-testid="format-180.6">{formatGlucose(180.6)}</span>
      <span data-testid="range-min">{convertRange(70, 180).min}</span>
      <span data-testid="range-max">{convertRange(70, 180).max}</span>
    </div>
  );
}

function renderHarness() {
  return render(
    <GlucoseUnitsProvider>
      <Harness />
    </GlucoseUnitsProvider>,
  );
}

describe("GlucoseUnitsProvider", () => {
  it("utilise mg/dL par défaut et convertit en identité", () => {
    renderHarness();
    expect(screen.getByTestId("unit").textContent).toBe("mg/dL");
    expect(screen.getByTestId("convert-180").textContent).toBe("180");
    expect(screen.getByTestId("convert-70").textContent).toBe("70");
    expect(screen.getByTestId("convert-0").textContent).toBe("0");
  });

  it("formate en mg/dL avec arrondi entier", () => {
    renderHarness();
    expect(screen.getByTestId("format-180").textContent).toBe("180 mg/dL");
    expect(screen.getByTestId("format-100").textContent).toBe("100 mg/dL");
    expect(screen.getByTestId("format-5").textContent).toBe("5 mg/dL");
    expect(screen.getByTestId("format-0").textContent).toBe("0 mg/dL");
    // Arrondi Math.round sur la valeur convertie
    expect(screen.getByTestId("format-180.4").textContent).toBe("180 mg/dL");
    expect(screen.getByTestId("format-180.6").textContent).toBe("181 mg/dL");
  });

  it("convertit en mmol/L en divisant par 18", () => {
    renderHarness();
    fireEvent.click(screen.getByText("to-mmol"));
    expect(screen.getByTestId("unit").textContent).toBe("mmol/L");
    expect(screen.getByTestId("convert-180").textContent).toBe("10");
    expect(screen.getByTestId("convert-70").textContent).toBe("3.888888888888889");
    expect(screen.getByTestId("convert-0").textContent).toBe("0");
  });

  it("formate en mmol/L avec une décimale (toFixed(1))", () => {
    renderHarness();
    fireEvent.click(screen.getByText("to-mmol"));
    expect(screen.getByTestId("format-180").textContent).toBe("10.0 mmol/L");
    expect(screen.getByTestId("format-100").textContent).toBe("5.6 mmol/L"); // 100/18 = 5.555...
    expect(screen.getByTestId("format-5").textContent).toBe("0.3 mmol/L"); // 5/18 = 0.277...
    expect(screen.getByTestId("format-0").textContent).toBe("0.0 mmol/L");
  });

  it("peut revenir de mmol/L vers mg/dL", () => {
    renderHarness();
    fireEvent.click(screen.getByText("to-mmol"));
    fireEvent.click(screen.getByText("to-mgdl"));
    expect(screen.getByTestId("unit").textContent).toBe("mg/dL");
    expect(screen.getByTestId("format-180").textContent).toBe("180 mg/dL");
  });

  it("convertit une plage (min/max) en mg/dL", () => {
    renderHarness();
    expect(screen.getByTestId("range-min").textContent).toBe("70");
    expect(screen.getByTestId("range-max").textContent).toBe("180");
  });

  it("convertit une plage (min/max) en mmol/L", () => {
    renderHarness();
    fireEvent.click(screen.getByText("to-mmol"));
    expect(Number(screen.getByTestId("range-min").textContent)).toBeCloseTo(3.8889, 3);
    expect(Number(screen.getByTestId("range-max").textContent)).toBeCloseTo(10, 3);
  });

  it("lève une erreur quand useGlucoseUnits est utilisé hors provider", () => {
    function Outside() {
      useGlucoseUnits();
      return null;
    }
    // React 19 projette l'erreur de rendu via le handler global ; on capture
    // la console.error attendue pour éviter le bruit dans le rapport de test.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      expect(() => render(<Outside />)).toThrow(
        "useGlucoseUnits must be used within a GlucoseUnitsProvider",
      );
    } finally {
      spy.mockRestore();
    }
  });
});
