"use client";

import { Button } from "@/components/ui/button";
import { useGlucoseUnits } from "@/lib/glucoseUnits";
import { useTranslation } from 'react-i18next';

export function GlucoseUnitSelector() {
  const { unit, setUnit } = useGlucoseUnits();
  const { t } = useTranslation('common');

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">{t('GlucoseUnitSelector.units')}:</span>
      <div className="flex border rounded-md">
        <Button
          variant={unit === 'mg/dL' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setUnit('mg/dL')}
          className="rounded-r-none"
        >
          mg/dL
        </Button>
        <Button
          variant={unit === 'mmol/L' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setUnit('mmol/L')}
          className="rounded-l-none"
        >
          mmol/L
        </Button>
      </div>
    </div>
  );
} 