"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/dashboard/Header";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { GlucoseTrendChart } from "@/components/dashboard/GlucoseTrendChart";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentAlerts } from "@/components/dashboard/RecentAlerts";
import { DataManagement } from "@/components/dashboard/DataManagement";
import { DateRange } from "react-day-picker";
import { ReferenceDot } from "recharts";
import { format } from "date-fns";
import { TreatmentChart } from "@/components/dashboard/TreatmentChart";
import { DailyStats } from "@/components/dashboard/DailyStats";
import { ShareLinks } from "@/components/dashboard/ShareLinks";
import { TimeInRange } from "@/components/dashboard/TimeInRange";

export default function Home() {
  const router = useRouter();
  const [url, setUrl] = useState<string | null>(null);
  const [date, setDate] = useState<DateRange | undefined>(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 6);
    return { from, to };
  });

  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  });

  useEffect(() => {
    const storedUrl = localStorage.getItem("nightscoutUrl");
    if (!storedUrl) {
      router.push("/login");
    } else {
      setUrl(storedUrl);
    }
  }, [router]);

  const [data, setData] = useState<any[]>([]);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (url && date?.from && date?.to) {
      setLoading(true);
      const from = date.from.getTime();
      const to = date.to.getTime();
      const token = localStorage.getItem("nightscoutToken");

      const entriesUrl = `${url}/api/v1/entries.json?token=${token}&find[date][$gte]=${from}&find[date][$lte]=${to}&count=10000`;
      const treatmentsUrl = `${url}/api/v1/treatments.json?token=${token}&find[created_at][$gte]=${new Date(from).toISOString()}&find[created_at][$lte]=${new Date(to).toISOString()}&count=10000`;

      Promise.all([
        fetch(entriesUrl).then(res => res.json()),
        fetch(treatmentsUrl).then(res => res.json())
      ])
        .then(([entries, treatments]) => {
          setData(entries);
          setTreatments(treatments);
          setLoading(false);
          console.log("entries", entries);
          console.log("treatments", treatments);
        })
        .catch(e => { console.error(e); setLoading(false); });
    }
  }, [url, date]);

  const bolusPoints = treatments
    .filter(t => t.insulin && t.date)
    .map(t => ({
      time: format(new Date(t.date), "HH:mm"),
      date: t.date,
      insulin: t.insulin
    }));

  const carbsPoints = treatments
    .filter(t => t.carbs && t.date)
    .map(t => ({
      time: format(new Date(t.date), "HH:mm"),
      date: t.date,
      carbs: t.carbs
    }));

  if (!url) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Redirection vers la page de connexion...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header date={date} setDate={setDate} />
      <main className="flex-1 p-4 md:p-8 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-2"></span>
            <span>Chargement des données...</span>
          </div>
        ) : (
          <>
            <StatsGrid data={data} />
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <GlucoseTrendChart data={data} treatments={treatments} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
              
              
             
              </div>
              <div className="space-y-6">
                <DailyStats data={data} treatments={treatments} selectedDate={selectedDate} />
                <TimeInRange data={data} treatments={treatments} selectedDate={selectedDate} />
                <ShareLinks />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
