import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "."),
    },
  },
  test: {
    // Environnement par défaut : node (logique pure, rapide).
    // Le fichier de test du provider React (glucoseUnits.test.tsx)
    // force jsdom via le commentaire @vitest-environment jsdom.
    environment: "node",
    include: ["__tests__/**/*.test.{ts,tsx}"],
  },
});
