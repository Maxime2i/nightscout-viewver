"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type GlucoseUnit = 'mg/dL' | 'mmol/L';

interface GlucoseUnitsContextType {
  unit: GlucoseUnit;
  setUnit: (unit: GlucoseUnit) => void;
  convertGlucose: (value: number) => number;
  formatGlucose: (value: number) => string;
  convertRange: (min: number, max: number) => { min: number; max: number };
}

const GlucoseUnitsContext = createContext<GlucoseUnitsContextType | undefined>(undefined);

export function GlucoseUnitsProvider({ children }: { children: ReactNode }) {
  const [unit, setUnit] = useState<GlucoseUnit>('mg/dL');

  const convertGlucose = (value: number): number => {
    if (unit === 'mmol/L') {
      // Conversion mg/dL vers mmol/L: diviser par 18
      return value / 18;
    }
    return value;
  };

  const formatGlucose = (value: number): string => {
    const convertedValue = convertGlucose(value);
    if (unit === 'mmol/L') {
      return `${convertedValue.toFixed(1)} mmol/L`;
    }
    return `${Math.round(convertedValue)} mg/dL`;
  };

  const convertRange = (min: number, max: number): { min: number; max: number } => {
    return {
      min: convertGlucose(min),
      max: convertGlucose(max)
    };
  };

  return (
    <GlucoseUnitsContext.Provider value={{
      unit,
      setUnit,
      convertGlucose,
      formatGlucose,
      convertRange
    }}>
      {children}
    </GlucoseUnitsContext.Provider>
  );
}

export function useGlucoseUnits() {
  const context = useContext(GlucoseUnitsContext);
  if (context === undefined) {
    throw new Error('useGlucoseUnits must be used within a GlucoseUnitsProvider');
  }
  return context;
} 