"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Sparkles, Loader2, AlertCircle } from "lucide-react";
import {
  NightscoutEntry,
  NightscoutTreatment,
  NightscoutProfile,
} from "@/types/nightscout";
import { useGlucoseUnits } from "@/lib/glucoseUnits";
import { endOfDay, startOfDay, subDays } from "date-fns";

interface AIAnalysisCardProps {
  data: NightscoutEntry[];
  treatments: NightscoutTreatment[];
  profile?: NightscoutProfile | null;
  isDemo?: boolean;
}

export function AIAnalysisCard({
  data,
  treatments,
  profile = null,
  isDemo = false,
}: AIAnalysisCardProps) {
  const { t } = useTranslation("common");
  const { unit } = useGlucoseUnits();
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const now = new Date();
  const end = endOfDay(now);
  const start = startOfDay(subDays(now, 6));
  const last7DaysEntries = data.filter((e) => {
    const d = new Date(e.date);
    return e.sgv != null && d >= start && d <= end;
  });
  const last7DaysTreatments = treatments.filter((t) => {
    const d = new Date(t.date || t.created_at || t.timestamp);
    return d >= start && d <= end;
  });
  const hasEnoughData = last7DaysEntries.length >= 10;

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const res = await fetch("/api/ai-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: last7DaysEntries,
          treatments: last7DaysTreatments,
          unit: unit === "mmol/L" ? "mmol/L" : "mg/dL",
          profile: profile ?? null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || t("AIAnalysisCard.errorGeneric"));
        return;
      }
      setAnalysis(json.analysis || "");
    } catch {
      setError(t("AIAnalysisCard.errorGeneric"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
          {t("AIAnalysisCard.title")}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {t("AIAnalysisCard.description")}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {isDemo && (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            {t("Demo.aiDisabled")}
          </p>
        )}
        {!isDemo && !hasEnoughData && (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            {t("AIAnalysisCard.notEnoughData")}
          </p>
        )}
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/50 p-3 text-sm text-red-700 dark:text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {analysis && (
          <div className="rounded-lg border bg-muted/30 dark:bg-muted/10 p-4 text-sm whitespace-pre-line leading-relaxed">
            {analysis}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-end gap-2">
        <Button
          onClick={handleAnalyze}
          disabled={loading || !hasEnoughData || isDemo}
          className="bg-amber-600 hover:bg-amber-700 text-white w-full sm:w-auto"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t("AIAnalysisCard.analyzing")}
            </>
          ) : (
            t("AIAnalysisCard.analyze")
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
