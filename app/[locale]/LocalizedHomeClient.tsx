"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/dashboard/Header";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { GlucoseTrendChart } from "@/components/dashboard/GlucoseTrendChart";
import { DateRange } from "react-day-picker";
import { DailyStats } from "@/components/dashboard/DailyStats";
import { ShareLinks } from "@/components/dashboard/ShareLinks";
import { SupportProject } from "@/components/dashboard/SupportProject";
import { TimeInRange } from "@/components/dashboard/TimeInRange";
import { FeedbackCard } from "@/components/dashboard/FeedbackCard";
import { PdfModal } from "@/components/dashboard/PdfModal";
import { generateNightscoutPdf } from "@/lib/pdfGenerator";
import { useTranslation } from "react-i18next";
import "../../i18n";
import {
  NightscoutEntry,
  NightscoutTreatment,
  NightscoutProfile,
} from "@/types/nightscout";
import { SendToMyDiabbyCard } from "@/components/dashboard/SendToMyDiabbyCard";
import { AIAnalysisCard } from "@/components/dashboard/AIAnalysisCard";
import { isDemoMode } from "@/lib/demoData";
import { GlucoseUnitsProvider, useGlucoseUnits } from "@/lib/glucoseUnits";

interface LocalizedHomeClientProps {
  locale: string;
}

function LocalizedHomeClientContent({ locale }: LocalizedHomeClientProps) {
  const router = useRouter();
  const { t, i18n } = useTranslation("common");
  const { unit } = useGlucoseUnits();
  const [url, setUrl] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [date, setDate] = useState<DateRange | undefined>(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 14);
    return { from, to };
  });

  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  });

  const [pdfModalOpen, setPdfModalOpen] = useState(false);

  // Initialiser la langue immédiatement
  if (locale && i18n.language !== locale) {
    i18n.changeLanguage(locale);
  }

  useEffect(() => {
    const storedUrl = localStorage.getItem("nightscoutUrl");
    if (!storedUrl) {
      router.push(`/${locale}/login`);
    } else {
      setUrl(storedUrl);
      setIsDemo(isDemoMode(storedUrl));
    }
  }, [router, locale]);

  const [data, setData] = useState<NightscoutEntry[]>([]);
  const [treatments, setTreatments] = useState<NightscoutTreatment[]>([]);
  const [loading, setLoading] = useState(false);
  const [profil, setProfil] = useState<NightscoutProfile | null>(null);

  useEffect(() => {
    if (url && date?.from && date?.to) {
      setLoading(true);
      const from = date.from.getTime();
      const to = date.to.getTime();
      const token = localStorage.getItem("nightscoutToken");

      // Appel via le proxy API Next.js pour éviter les blocages CORS côté Nightscout
      const fetchViaProxy = async (
        endpoint: string,
        body: Record<string, unknown>
      ) => {
        const res = await fetch(`/api/nightscout/${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error || `HTTP ${res.status}`);
        }
        return res.json();
      };

      Promise.all([
        fetchViaProxy("entries", { url, token, from, to }),
        fetchViaProxy("treatments", { url, token, from, to }),
        fetchViaProxy("profile", { url, token }),
      ])
        .then(
          ([entries, treatments, profil]: [
            NightscoutEntry[],
            NightscoutTreatment[],
            NightscoutProfile
          ]) => {
            setData(entries);
            setTreatments(treatments);
            setProfil(profil);
            setLoading(false);
            console.log("entries", entries);
            console.log(
              "treatments",
              treatments.filter(
                (t: NightscoutTreatment) =>
                  t.eventType !== "Meal Bolus" &&
                  t.eventType !== "Temp Basal" &&
                  t.eventType !== "Carb Correction" &&
                  t.eventType !== "Correction Bolus"
              )
            );
          }
        )
        .catch((e) => {
          console.error(e);
          setLoading(false);
        });
    }
  }, [url, date]);

  // Nouvelle fonction simplifiée pour générer le PDF
  const handleGeneratePdf = (infos: {
    nom: string;
    prenom: string;
    dateNaissance: string;
    insuline: string;
    diabeteDepuis: string;
    includeCharts: boolean;
    includeVariabilityChart: boolean;
  }) => {
    generateNightscoutPdf(
      {
        data,
        treatments,
        profil,
        date,
      },
      infos,
      t,
      unit
    );
    setPdfModalOpen(false);
  };

  if (!url) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>{t("loading")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header
        date={date}
        setDate={setDate}
        onOpenPdfModal={() => setPdfModalOpen(true)}
      />
      {isDemo && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 px-4 py-2 text-center text-sm text-amber-800 dark:text-amber-200">
          {t("Demo.banner")}
        </div>
      )}
      <main className="flex-1 p-2 sm:p-4 md:p-8 space-y-4 md:space-y-6 max-w-full w-full mx-auto">
        {loading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-2"></span>
            <span>{t("loading")}</span>
          </div>
        ) : (
          <>
            <StatsGrid data={data} />
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
              <div className="lg:col-span-2 min-w-0">
                <GlucoseTrendChart
                  data={data}
                  treatments={treatments}
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  profil={profil ?? undefined}
                />
              </div>
              <div className="space-y-6">
                <DailyStats
                  data={data}
                  treatments={treatments}
                  selectedDate={selectedDate}
                />
                <TimeInRange data={data} selectedDate={selectedDate} />
                <ShareLinks />
                <AIAnalysisCard
                  data={data}
                  treatments={treatments}
                  profile={profil}
                  isDemo={isDemo}
                />
                <SendToMyDiabbyCard data={data} treatments={treatments} isDemo={isDemo} />
                <SupportProject />
                <FeedbackCard />
                <PdfModal
                  open={pdfModalOpen}
                  onClose={() => setPdfModalOpen(false)}
                  onGenerate={handleGeneratePdf}
                />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export function LocalizedHomeClient({ locale }: LocalizedHomeClientProps) {
  return (
    <GlucoseUnitsProvider>
      <LocalizedHomeClientContent locale={locale} />
    </GlucoseUnitsProvider>
  );
}
