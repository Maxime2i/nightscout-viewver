"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/dashboard/Header";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { GlucoseTrendChart } from "@/components/dashboard/GlucoseTrendChart";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { DailyStats } from "@/components/dashboard/DailyStats";
import { ShareLinks } from "@/components/dashboard/ShareLinks";
import { SupportProject } from "@/components/dashboard/SupportProject";
import { TimeInRange } from "@/components/dashboard/TimeInRange";
import { FeedbackCard } from "@/components/dashboard/FeedbackCard";
import { PdfModal } from "@/components/dashboard/PdfModal";
import jsPDF from "jspdf";
import { useTranslation } from 'react-i18next';
import '../i18n';
import { NightscoutEntry, NightscoutTreatment, NightscoutProfile } from '@/types/nightscout';

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

  // Nouvelle fonction avancée pour générer le PDF style Nightscout Reporter
  const handleGeneratePdf = (infos: {
    nom: string;
    prenom: string;
    dateNaissance: string;
    insuline: string;
    diabeteDepuis: string;
  }) => {
    const doc = new jsPDF();
    let y = 18;
    // Titre principal
    doc.setFontSize(28);
    doc.setTextColor(0, 102, 204); // bleu
    doc.text(t('PdfGeneration.analysis'), 12, y);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(t('Header.title'), 12, y + 6);
    // Période
    const from = date?.from ? format(date.from, "dd/MM/yyyy") : "-";
    const toDate = date?.to ? format(date.to, "dd/MM/yyyy") : "-";
    doc.text(`${from} ${t('PdfGeneration.untilDate')} ${toDate}`, 198, y + 6, { align: "right" });
    // Ligne bleue
    doc.setDrawColor(0, 102, 204);
    doc.setLineWidth(2);
    doc.line(12, y + 9, 198, y + 9);
    y += 22;
    // Nom centré
    doc.setFontSize(22);
    doc.setTextColor(0, 0, 0);
    doc.text(
      `${
        infos.prenom
          ? infos.prenom.charAt(0).toUpperCase() + infos.prenom.slice(1)
          : ""
      } ${infos.nom.toUpperCase()}`,
      105,
      y,
      { align: "center" }
    );
    y += 10;
    // Infos patient
    doc.setFontSize(12);
    doc.text(t('PdfGeneration.birthDate'), 40, y);
    doc.setTextColor(0, 102, 204);
    doc.text(infos.dateNaissance.split("-").reverse().join(" "), 80, y);
    doc.setTextColor(0, 0, 0);
    doc.text(t('PdfGeneration.diabeticSince'), 120, y);
    doc.setTextColor(0, 102, 204);
    doc.text(infos.diabeteDepuis.replace("-", " "), 160, y);
    y += 7;
    doc.setTextColor(0, 0, 0);
    doc.text(t('PdfGeneration.insulin'), 40, y);
    doc.setTextColor(0, 102, 204);
    doc.text(infos.insuline, 80, y);
    doc.setTextColor(0, 0, 0);
    // --- Calculs statistiques ---
    // Jours évalués
    const uniqueDays = new Set(
      data.map((e) => format(new Date(e.date), "yyyy-MM-dd"))
    );
    const joursEvalues = uniqueDays.size;
    // Nombre de mesures
    const nbMesures = data.length;
    // Changements de réservoir/cathéter/capteur
    const nbPump = treatments.filter(
      (t) => t.eventType && t.eventType.toLowerCase().includes("site change")
    ).length;
    const nbCapteur = treatments.filter(
      (t) => t.eventType && t.eventType.toLowerCase().includes("sensor change")
    ).length;
    // Valeurs glycémiques
    const values = data
      .map((e) => e.sgv || e.glucose)
      .filter((v) => typeof v === "number");
    // Nouvelles zones cibles
    const below70 = values.filter((v) => v < 70);
    const inRange = values.filter((v) => v >= 70 && v <= 180);
    const above180 = values.filter((v) => v > 180 && v <= 240);
    const above240 = values.filter((v) => v > 240);
    const pctBelow = values.length
      ? Math.round((below70.length / values.length) * 100)
      : 0;
    const pctIn = values.length
      ? Math.round((inRange.length / values.length) * 100)
      : 0;
    const pct180_240 = values.length
      ? Math.round((above180.length / values.length) * 100)
      : 0;
    const pctAbove240 = values.length
      ? Math.round((above240.length / values.length) * 100)
      : 0;
    // Min, max, écart-type
    const minVal = values.length ? Math.min(...values) : 0;
    const maxVal = values.length ? Math.max(...values) : 0;
    const mean = values.length
      ? values.reduce((a, b) => a + b, 0) / values.length
      : 0;
    const std = values.length
      ? Math.sqrt(
          values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length
        )
      : 0;
    // GVI (index de variabilité glycémique)
    const gvi = mean ? (std / mean) * 100 : 0;
    // PGS (statut glycémique patient)
    const tir =
      (values.filter((v) => v >= 70 && v <= 180).length / values.length) * 100;
    let tirScore = 0;
    if (tir >= 70) tirScore = 5;
    else if (tir >= 55) tirScore = 4;
    else if (tir >= 40) tirScore = 3;
    else if (tir >= 25) tirScore = 2;
    else if (tir >= 10) tirScore = 1;

    const tar = (values.filter((v) => v > 180).length / values.length) * 100;
    let tarScore = 0;
    if (tar < 25) tarScore = 5;
    else if (tar < 40) tarScore = 4;
    else if (tar < 55) tarScore = 3;
    else if (tar < 70) tarScore = 2;
    else if (tar < 90) tarScore = 1;

    const tbr = (values.filter((v) => v < 70).length / values.length) * 100;
    let tbrScore = 0;
    if (tbr < 4) tbrScore = 5;
    else if (tbr < 10) tbrScore = 4;
    else if (tbr < 15) tbrScore = 3;
    else if (tbr < 25) tbrScore = 2;
    else if (tbr < 40) tbrScore = 1;

    const cv = (std / mean) * 100;
    let cvScore = 0;
    if (cv < 25) cvScore = 5;
    else if (cv < 33) cvScore = 4;
    else if (cv < 40) cvScore = 3;
    else if (cv < 50) cvScore = 2;
    else if (cv < 60) cvScore = 1;

    let meanScore = 0;
    if (mean < 120) meanScore = 5;
    else if (mean < 145) meanScore = 4;
    else if (mean < 170) meanScore = 3;
    else if (mean < 200) meanScore = 2;
    else if (mean < 250) meanScore = 1;

    const pgs = (tirScore * 2 + tarScore + tbrScore + cvScore + meanScore) / 6;

    // HbA1c estimée
    const hba1c = mean ? ((mean + 46.7) / 28.7).toFixed(1) : "-";
    // Moyennes traitements
    const jours = joursEvalues || 1;
    const totalGlucides = treatments.reduce(
      (sum, t) => sum + (t.carbs || 0),
      0
    );

    const totalBolus = treatments
      .filter(
        (t) =>
          t.insulin &&
          t.eventType &&
          t.eventType.toLowerCase().includes("bolus")
      )
      .reduce((sum, t) => sum + (t.insulin || 0), 0);

    // --- Calcul basale réelle délivrée ---
    function getBasalProfileValueAt(ts: number, profil: NightscoutProfile | null, dateRef: Date): number {
      if (!profil || !profil.store) return 0;
      
      // Utiliser le profil par défaut
      const defaultProfileName = profil.defaultProfile;
      const profileData = profil.store[defaultProfileName];
      
      if (!profileData || !profileData.basal) return 0;
      
      const basalArray = profileData.basal;
      let last = basalArray[0];
      for (const b of basalArray) {
        const d = new Date(dateRef);
        const [h, m] = b.time.split(":");
        d.setHours(Number(h), Number(m), 0, 0);
        if (d.getTime() <= ts) {
          last = b;
        } else {
          break;
        }
      }
      return last.value;
    }

    // Calcul de la basale délivrée sur toute la période
    function computeRealBasalPerDay() {
      if (!profil || !date?.from || !date?.to) return 0;
      const dayMs = 24 * 60 * 60 * 1000;
      const fromDay = new Date(date.from);
      fromDay.setHours(0, 0, 0, 0);
      const toDay = new Date(date.to);
      toDay.setHours(0, 0, 0, 0);
      const nbDays = Math.round((toDay.getTime() - fromDay.getTime()) / dayMs) + 1;
      let totalBasal = 0;
      for (let d = 0; d < nbDays; d++) {
        const day = new Date(fromDay.getTime() + d * dayMs);
        // Récupérer tous les temp basal de la journée
        const dayStart = new Date(day); dayStart.setHours(0,0,0,0);
        const dayEnd = new Date(day); dayEnd.setHours(23,59,59,999);
        const tempBasals = treatments.filter((t: NightscoutTreatment) => t.eventType === "Temp Basal" && t.timestamp && t.duration && t.rate && new Date(t.timestamp) >= dayStart && new Date(t.timestamp) <= dayEnd)
          .map((t: NightscoutTreatment) => ({
            start: new Date(t.timestamp).getTime(),
            end: new Date(t.timestamp).getTime() + (t.duration || 0) * 60000,
            rate: t.rate || 0
          }));
        // Pour chaque minute de la journée
        let delivered = 0;
        for (let min = 0; min < 1440; min++) {
          const ts = dayStart.getTime() + min * 60000;
          // Chercher un temp basal actif
          const temp = tempBasals.find(tb => ts >= tb.start && ts < tb.end);
          let rate = 0;
          if (temp) {
            rate = temp.rate;
          } else {
            rate = getBasalProfileValueAt(ts, profil, day);
          }
          delivered += rate / 60; // U/min
        }
        totalBasal += delivered;
      }
      return totalBasal / nbDays;
    }
    const realBasalPerDay = computeRealBasalPerDay();
    const totalInsuline = (totalBolus / jours) + realBasalPerDay;
    // --- Affichage sections ---
    y += 10;
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(t('PdfGeneration.daysEvaluated'), 20, y);
    doc.text(`${joursEvalues}`, 60, y);
    doc.text(t('PdfGeneration.numberOfGlucoseMeasurements'), 20, y + 6);
    doc.text(`${nbMesures}`, 80, y + 6);
    doc.text(t('PdfGeneration.numberOfPumpChanges'), 20, y + 12);
    doc.text(`${nbPump}`, 90, y + 12);
    doc.text(t('PdfGeneration.numberOfSensorChanges'), 20, y + 18);
    doc.text(`${nbCapteur}`, 90, y + 18);
    // Séparateur
    doc.setDrawColor(150);
    doc.line(15, y + 28, 195, y + 28);
    // Zone cible
    y += 36;
    doc.setFontSize(11);
    doc.text(t('PdfGeneration.standardTargetZone'), 20, y);
    y += 6;
    doc.setFontSize(10);
    // Affichage des pourcentages et légende avec couleur
    // Légende avec carrés colorés
    let legendY = y;

    // >240 mg/dL (orange)
    doc.setFillColor(255, 137, 4);
    doc.rect(22, legendY - 4, 4, 4, "F");
    doc.text(`>240 mg/dL`, 28, legendY);
    doc.text(`${pctAbove240} %`, 60, legendY);
    doc.text(`${above240.length} ${t('PdfGeneration.values')}`, 80, legendY);
    legendY += 12;

    // 180–240 mg/dL (jaune)
    doc.setFillColor(252, 200, 0);
    doc.rect(22, legendY - 4, 4, 4, "F");
    doc.text(`180–240 mg/dL`, 28, legendY);
    doc.text(`${pct180_240} %`, 60, legendY);
    doc.text(`${above180.length} ${t('PdfGeneration.values')}`, 80, legendY);
    legendY += 12;

    // 70–180 mg/dL (vert)
    doc.setFillColor(124, 207, 0);
    doc.rect(22, legendY - 4, 4, 4, "F");
    doc.text(`70–180 mg/dL`, 28, legendY);
    doc.text(`${pctIn} %`, 60, legendY);
    doc.text(`${inRange.length} ${t('PdfGeneration.values')}`, 80, legendY);
    legendY += 12;

    // <70 mg/dL (rouge)
    doc.setFillColor(251, 44, 54);
    doc.rect(22, legendY - 4, 4, 4, "F");
    doc.text(`<70 mg/dL`, 28, legendY);
    doc.text(`${pctBelow} %`, 60, legendY);
    doc.text(`${below70.length} ${t('PdfGeneration.values')}`, 80, legendY);

    // Barre unique segmentée VERTICALE
    // Hauteur totale de la barre (en %)
    const barHeight = 50;
    const barX = 150;
    const barY = y - 10; // position verticale de départ
    let currentY = barY;

    // Segment >240 (orange)
    doc.setFillColor(255, 137, 4);
    doc.rect(barX, currentY, 8, barHeight * (pctAbove240 / 100), "F");
    currentY += barHeight * (pctAbove240 / 100);

    // Segment 180-240 (jaune)
    doc.setFillColor(252, 200, 0);
    doc.rect(barX, currentY, 8, barHeight * (pct180_240 / 100), "F");
    currentY += barHeight * (pct180_240 / 100);

    // Segment 70-180 (vert)
    doc.setFillColor(124, 207, 0);
    doc.rect(barX, currentY, 8, barHeight * (pctIn / 100), "F");
    currentY += barHeight * (pctIn / 100);

    // Segment <70 (rouge)
    doc.setFillColor(251, 44, 54);
    doc.rect(barX, currentY, 8, barHeight * (pctBelow / 100), "F");

    // Séparateur
    y = legendY + 12;
    doc.setDrawColor(150);
    doc.line(15, y, 195, y);
    // Période
    y += 8;
    doc.setFontSize(11);
    doc.text(t('PdfGeneration.period'), 20, y);
    y += 6;
    doc.setFontSize(10);
    doc.text(t('PdfGeneration.lowestValuePeriod'), 22, y);
    doc.text(`${minVal} mg/dL`, 90, y);
    y += 6;
    doc.text(t('PdfGeneration.highestValuePeriod'), 22, y);
    doc.text(`${maxVal} mg/dL`, 90, y);
    y += 6;
    doc.text(t('PdfGeneration.standardDeviation'), 22, y);
    doc.text(`${std.toFixed(1)} mg/dL`, 90, y);
    y += 6;
    doc.text(t('PdfGeneration.gvi'), 22, y);
    doc.text(`${gvi.toFixed(2)}`, 90, y);
    doc.text(
      gvi < 25
        ? t('PdfGeneration.excellentControl')
        : gvi < 33
        ? t('PdfGeneration.goodControl')
        : gvi < 40
        ? t('PdfGeneration.mediumControl')
        : t('PdfGeneration.poorControl'),
      120,
      y
    );
    y += 6;
    doc.text(t('PdfGeneration.pgs'), 22, y);
    doc.text(`${pgs.toFixed(2)}`, 90, y);
    doc.text(pgs >= 4.5 ? t('PdfGeneration.excellentControl') : pgs >= 3.5 ? t('PdfGeneration.goodControl') : pgs >= 2.5 ? t('PdfGeneration.mediumControl') : t('PdfGeneration.poorControl'), 120, y);
    y += 6;
    doc.text(t('PdfGeneration.averageGlucose'), 22, y);
    doc.text(`${mean.toFixed(0)} mg/dL`, 90, y);
    y += 6;
    doc.text(t('PdfGeneration.estimatedHbA1c'), 22, y);
    doc.text(`${hba1c} %`, 90, y);
    // Séparateur
    y += 8;
    doc.setDrawColor(150);
    doc.line(15, y, 195, y);
    // Traitements
    y += 8;
    doc.setFontSize(11);
    doc.text(t('PdfGeneration.treatments'), 20, y);
    y += 6;
    doc.setFontSize(10);
    doc.text(t('PdfGeneration.averageCarbsPerDay'), 22, y);
    doc.text(`${(totalGlucides / jours).toFixed(1)} ${t('PdfGeneration.gOfCarbs')}`, 90, y);
    y += 6;
    doc.text(t('PdfGeneration.averageInsulinPerDay'), 22, y);
    doc.text(`${totalInsuline.toFixed(1)} ${t('PdfGeneration.units')}`, 90, y);
    y += 6;
    doc.text(t('PdfGeneration.averageBolusPerDay'), 22, y);
    doc.text(`${(totalBolus / jours).toFixed(1)} ${t('PdfGeneration.units')}`, 90, y);
    y += 6;
    doc.text(t('PdfGeneration.averageBasalPerDay'), 22, y);
    doc.text(`${realBasalPerDay.toFixed(1)} ${t('PdfGeneration.units')}`, 90, y);
    // --- Fin ---
    // doc.save(`rapport_glycemie_${infos.nom}_${infos.prenom}.pdf`);
    window.open(doc.output("bloburl"), "_blank");
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
      <main className="flex-1 p-4 md:p-8 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-2"></span>
            <span>{t('loading')}</span>
          </div>
        ) : (
          <>
            <StatsGrid data={data} />
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
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
