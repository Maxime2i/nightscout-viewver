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
import { useTranslation } from 'react-i18next';
import '../i18n';
import { NightscoutEntry, NightscoutTreatment, NightscoutProfile } from '@/types/nightscout';
import { SendToMyDiabbyCard } from "@/components/dashboard/SendToMyDiabbyCard";

export default function Home() {
  const router = useRouter();
  const { t } = useTranslation('common');
  const [url, setUrl] = useState<string | null>(null);
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

  useEffect(() => {
    const storedUrl = localStorage.getItem("nightscoutUrl");
    if (!storedUrl) {
      router.push("/login");
    } else {
      setUrl(storedUrl);
    }
  }, [router]);

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

      const entriesUrl = `${url}/api/v1/entries.json?token=${token}&find[date][$gte]=${from}&find[date][$lte]=${to}&count=10000`;
      const treatmentsUrl = `${url}/api/v1/treatments.json?token=${token}&find[created_at][$gte]=${new Date(
        from
      ).toISOString()}&find[created_at][$lte]=${new Date(
        to
      ).toISOString()}&count=10000`;
      const profilUrl = `${url}/api/v1/profile.json?token=${token}`;

      Promise.all([
        fetch(entriesUrl).then((res) => res.json()),
        fetch(treatmentsUrl).then((res) => res.json()),
        fetch(profilUrl).then((res) => res.json()),
      ])
        .then(([entries, treatments, profil]: [NightscoutEntry[], NightscoutTreatment[], NightscoutProfile]) => {
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
        })
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
        date
      },
      infos,
      t
    );
    setPdfModalOpen(false);
  };

  if (!url) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>{t('loading')}</p>
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
      <main className="flex-1 p-2 sm:p-4 md:p-8 space-y-4 md:space-y-6 max-w-full w-full mx-auto">
        {loading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-2"></span>
            <span>{t('loading')}</span>
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
                <TimeInRange
                  data={data}
                  selectedDate={selectedDate}
                />
                <ShareLinks />
                <SendToMyDiabbyCard data={data} />
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
