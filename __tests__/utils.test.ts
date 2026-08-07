import { describe, it, expect } from "vitest";
import { cn } from "../lib/utils";

describe("cn", () => {
  it("combine des classes simples", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("ignore les valeurs falsy", () => {
    expect(cn(false, null, undefined, 0, "", "x")).toBe("x");
  });

  it("gère les objets conditionnels", () => {
    expect(cn({ active: true, hidden: false })).toBe("active");
  });

  it("gère les tableaux", () => {
    expect(cn(["a", "b"], "c")).toBe("a b c");
  });

  it("résout les conflits tailwind-merge en gardant la dernière classe", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("combine des classes sans conflit dans l'ordre", () => {
    expect(cn("font-bold", "text-sm", { underline: true })).toBe(
      "font-bold text-sm underline",
    );
  });

  it("retourne une chaîne vide sans arguments", () => {
    expect(cn()).toBe("");
  });
});
