import jsPDF from "jspdf";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { NightscoutEntry, NightscoutTreatment, NightscoutProfile } from '@/types/nightscout';

interface PatientInfo {
  nom: string;
  prenom: string;
  dateNaissance: string;
  insuline: string;
  diabeteDepuis: string;
  includeCharts: boolean;
  includeVariabilityChart: boolean;
}

interface PdfGenerationData {
  data: NightscoutEntry[];
  treatments: NightscoutTreatment[];
  profil: NightscoutProfile | null;
  date: DateRange | undefined;
}

interface StatisticsData {
  joursEvalues: number;
  nbMesures: number;
  nbPump: number;
  nbCapteur: number;
  values: number[];
  below70: number[];
  inRange: number[];
  above180: number[];
  above240: number[];
  pctBelow: number;
  pctIn: number;
  pct180_240: number;
  pctAbove240: number;
  minVal: number;
  maxVal: number;
  mean: number;
  std: number;
  gvi: number;
  pgs: number;
  hba1c: string;
  jours: number;
  totalGlucides: number;
  totalBolus: number;
  realBasalPerDay: number;
  totalInsuline: number;
}

export class NightscoutPdfGenerator {
  private doc: jsPDF;
  private data: NightscoutEntry[];
  private treatments: NightscoutTreatment[];
  private profil: NightscoutProfile | null;
  private date: DateRange | undefined;
  private t: (key: string) => string;

  constructor(
    { data, treatments, profil, date }: PdfGenerationData,
    translateFunction: (key: string) => string
  ) {
    this.doc = new jsPDF();
    this.data = data;
    this.treatments = treatments;
    this.profil = profil;
    this.date = date;
    this.t = translateFunction;
  }

  private getBasalProfileValueAt(ts: number, profil: NightscoutProfile | null, dateRef: Date): number {
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

  private computeRealBasalPerDay(): number {
    if (!this.profil || !this.date?.from || !this.date?.to) return 0;
    
    const dayMs = 24 * 60 * 60 * 1000;
    const fromDay = new Date(this.date.from);
    fromDay.setHours(0, 0, 0, 0);
    const toDay = new Date(this.date.to);
    toDay.setHours(0, 0, 0, 0);
    const nbDays = Math.round((toDay.getTime() - fromDay.getTime()) / dayMs) + 1;
    
    let totalBasal = 0;
    for (let d = 0; d < nbDays; d++) {
      const day = new Date(fromDay.getTime() + d * dayMs);
      // Récupérer tous les temp basal de la journée
      const dayStart = new Date(day); 
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day); 
      dayEnd.setHours(23, 59, 59, 999);
      
      const tempBasals = this.treatments
        .filter((t: NightscoutTreatment) => 
          t.eventType === "Temp Basal" && 
          t.timestamp && 
          t.duration && 
          t.rate && 
          new Date(t.timestamp) >= dayStart && 
          new Date(t.timestamp) <= dayEnd
        )
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
          rate = this.getBasalProfileValueAt(ts, this.profil, day);
        }
        delivered += rate / 60; // U/min
      }
      totalBasal += delivered;
    }
    return totalBasal / nbDays;
  }

  private calculateStatistics(): StatisticsData {
    // Jours évalués
    const uniqueDays = new Set(
      this.data.map((e) => format(new Date(e.date), "yyyy-MM-dd"))
    );
    const joursEvalues = uniqueDays.size;

    // Nombre de mesures
    const nbMesures = this.data.length;

    // Changements de réservoir/cathéter/capteur
    const nbPump = this.treatments.filter(
      (t) => t.eventType && t.eventType.toLowerCase().includes("site change")
    ).length;
    const nbCapteur = this.treatments.filter(
      (t) => t.eventType && t.eventType.toLowerCase().includes("sensor change")
    ).length;

    // Valeurs glycémiques
    const values = this.data
      .map((e) => e.sgv || e.glucose)
      .filter((v) => typeof v === "number");

    // Nouvelles zones cibles
    const below70 = values.filter((v) => v < 70);
    const inRange = values.filter((v) => v >= 70 && v <= 180);
    const above180 = values.filter((v) => v > 180 && v <= 240);
    const above240 = values.filter((v) => v > 240);

    const pctBelow = values.length ? Math.round((below70.length / values.length) * 100) : 0;
    const pctIn = values.length ? Math.round((inRange.length / values.length) * 100) : 0;
    const pct180_240 = values.length ? Math.round((above180.length / values.length) * 100) : 0;
    const pctAbove240 = values.length ? Math.round((above240.length / values.length) * 100) : 0;

    // Min, max, écart-type
    const minVal = values.length ? Math.min(...values) : 0;
    const maxVal = values.length ? Math.max(...values) : 0;
    const mean = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    const std = values.length 
      ? Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length) 
      : 0;

    // GVI (index de variabilité glycémique)
    const gvi = mean ? (std / mean) * 100 : 0;

    // PGS (statut glycémique patient)
    const tir = (values.filter((v) => v >= 70 && v <= 180).length / values.length) * 100;
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
    const totalGlucides = this.treatments.reduce((sum, t) => sum + (t.carbs || 0), 0);
    const totalBolus = this.treatments
      .filter((t) => t.insulin && t.eventType && t.eventType.toLowerCase().includes("bolus"))
      .reduce((sum, t) => sum + (t.insulin || 0), 0);

    const realBasalPerDay = this.computeRealBasalPerDay();
    const totalInsuline = (totalBolus / jours) + realBasalPerDay;

    return {
      joursEvalues,
      nbMesures,
      nbPump,
      nbCapteur,
      values,
      below70,
      inRange,
      above180,
      above240,
      pctBelow,
      pctIn,
      pct180_240,
      pctAbove240,
      minVal,
      maxVal,
      mean,
      std,
      gvi,
      pgs,
      hba1c,
      jours,
      totalGlucides,
      totalBolus,
      realBasalPerDay,
      totalInsuline
    };
  }

  private addHeader(): number {
    const y = 18;
    
    // Titre principal
    this.doc.setFontSize(28);
    this.doc.setTextColor(0, 102, 204); // bleu
    this.doc.text(this.t('PdfGeneration.analysis'), 12, y);
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(10);
    this.doc.text(this.t('Header.title'), 12, y + 6);
    
    // Période
    const from = this.date?.from ? format(this.date.from, "dd/MM/yyyy") : "-";
    const toDate = this.date?.to ? format(this.date.to, "dd/MM/yyyy") : "-";
    this.doc.text(`${from} ${this.t('PdfGeneration.untilDate')} ${toDate}`, 198, y + 6, { align: "right" });
    
    // Ligne bleue
    this.doc.setDrawColor(0, 102, 204);
    this.doc.setLineWidth(2);
    this.doc.line(12, y + 9, 198, y + 9);
    
    return y + 22;
  }

  private addPatientInfo(infos: PatientInfo, y: number): number {
    // Nom centré
    this.doc.setFontSize(22);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(
      `${infos.prenom ? infos.prenom.charAt(0).toUpperCase() + infos.prenom.slice(1) : ""} ${infos.nom.toUpperCase()}`,
      105,
      y,
      { align: "center" }
    );
    
    y += 10;
    
    // Infos patient
    this.doc.setFontSize(12);
    this.doc.text(this.t('PdfGeneration.birthDate'), 40, y);
    this.doc.setTextColor(0, 102, 204);
    this.doc.text(infos.dateNaissance.split("-").reverse().join(" "), 80, y);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(this.t('PdfGeneration.diabeticSince'), 120, y);
    this.doc.setTextColor(0, 102, 204);
    this.doc.text(infos.diabeteDepuis.replace("-", " "), 160, y);
    
    y += 7;
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(this.t('PdfGeneration.insulin'), 40, y);
    this.doc.setTextColor(0, 102, 204);
    this.doc.text(infos.insuline, 80, y);
    this.doc.setTextColor(0, 0, 0);
    
    return y + 10;
  }

  private addBasicStats(stats: StatisticsData, y: number): number {
    this.doc.setFontSize(11);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(this.t('PdfGeneration.daysEvaluated'), 20, y);
    this.doc.text(`${stats.joursEvalues}`, 60, y);
    this.doc.text(this.t('PdfGeneration.numberOfGlucoseMeasurements'), 20, y + 6);
    this.doc.text(`${stats.nbMesures}`, 80, y + 6);
    this.doc.text(this.t('PdfGeneration.numberOfPumpChanges'), 20, y + 12);
    this.doc.text(`${stats.nbPump}`, 90, y + 12);
    this.doc.text(this.t('PdfGeneration.numberOfSensorChanges'), 20, y + 18);
    this.doc.text(`${stats.nbCapteur}`, 90, y + 18);
    
    // Séparateur
    this.doc.setDrawColor(150);
    this.doc.line(15, y + 28, 195, y + 28);
    
    return y + 36;
  }

  private addTargetZone(stats: StatisticsData, y: number): number {
    this.doc.setFontSize(11);
    this.doc.text(this.t('PdfGeneration.standardTargetZone'), 20, y);
    y += 6;
    this.doc.setFontSize(10);
    
    // Affichage des pourcentages et légende avec couleur
    let legendY = y;

    // >240 mg/dL (orange)
    this.doc.setFillColor(255, 137, 4);
    this.doc.rect(22, legendY - 4, 4, 4, "F");
    this.doc.text(`>240 mg/dL`, 28, legendY);
    this.doc.text(`${stats.pctAbove240} %`, 60, legendY);
    this.doc.text(`${stats.above240.length} ${this.t('PdfGeneration.values')}`, 80, legendY);
    legendY += 12;

    // 180–240 mg/dL (jaune)
    this.doc.setFillColor(252, 200, 0);
    this.doc.rect(22, legendY - 4, 4, 4, "F");
    this.doc.text(`180–240 mg/dL`, 28, legendY);
    this.doc.text(`${stats.pct180_240} %`, 60, legendY);
    this.doc.text(`${stats.above180.length} ${this.t('PdfGeneration.values')}`, 80, legendY);
    legendY += 12;

    // 70–180 mg/dL (vert)
    this.doc.setFillColor(124, 207, 0);
    this.doc.rect(22, legendY - 4, 4, 4, "F");
    this.doc.text(`70–180 mg/dL`, 28, legendY);
    this.doc.text(`${stats.pctIn} %`, 60, legendY);
    this.doc.text(`${stats.inRange.length} ${this.t('PdfGeneration.values')}`, 80, legendY);
    legendY += 12;

    // <70 mg/dL (rouge)
    this.doc.setFillColor(251, 44, 54);
    this.doc.rect(22, legendY - 4, 4, 4, "F");
    this.doc.text(`<70 mg/dL`, 28, legendY);
    this.doc.text(`${stats.pctBelow} %`, 60, legendY);
    this.doc.text(`${stats.below70.length} ${this.t('PdfGeneration.values')}`, 80, legendY);

    // Barre unique segmentée VERTICALE
    const barHeight = 50;
    const barX = 150;
    const barY = y - 10;
    let currentY = barY;

    // Segment >240 (orange)
    this.doc.setFillColor(255, 137, 4);
    this.doc.rect(barX, currentY, 8, barHeight * (stats.pctAbove240 / 100), "F");
    currentY += barHeight * (stats.pctAbove240 / 100);

    // Segment 180-240 (jaune)
    this.doc.setFillColor(252, 200, 0);
    this.doc.rect(barX, currentY, 8, barHeight * (stats.pct180_240 / 100), "F");
    currentY += barHeight * (stats.pct180_240 / 100);

    // Segment 70-180 (vert)
    this.doc.setFillColor(124, 207, 0);
    this.doc.rect(barX, currentY, 8, barHeight * (stats.pctIn / 100), "F");
    currentY += barHeight * (stats.pctIn / 100);

    // Segment <70 (rouge)
    this.doc.setFillColor(251, 44, 54);
    this.doc.rect(barX, currentY, 8, barHeight * (stats.pctBelow / 100), "F");

    return legendY + 12;
  }

  private addPeriodStats(stats: StatisticsData, y: number): number {
    // Séparateur
    this.doc.setDrawColor(150);
    this.doc.line(15, y, 195, y);
    
    y += 8;
    this.doc.setFontSize(11);
    this.doc.text(this.t('PdfGeneration.period'), 20, y);
    y += 6;
    this.doc.setFontSize(10);
    
    this.doc.text(this.t('PdfGeneration.lowestValuePeriod'), 22, y);
    this.doc.text(`${stats.minVal} mg/dL`, 90, y);
    y += 6;
    
    this.doc.text(this.t('PdfGeneration.highestValuePeriod'), 22, y);
    this.doc.text(`${stats.maxVal} mg/dL`, 90, y);
    y += 6;
    
    this.doc.text(this.t('PdfGeneration.standardDeviation'), 22, y);
    this.doc.text(`${stats.std.toFixed(1)} mg/dL`, 90, y);
    y += 6;
    
    this.doc.text(this.t('PdfGeneration.gvi'), 22, y);
    this.doc.text(`${stats.gvi.toFixed(2)}`, 90, y);
    this.doc.text(
      stats.gvi < 25
        ? this.t('PdfGeneration.excellentControl')
        : stats.gvi < 33
        ? this.t('PdfGeneration.goodControl')
        : stats.gvi < 40
        ? this.t('PdfGeneration.mediumControl')
        : this.t('PdfGeneration.poorControl'),
      120,
      y
    );
    y += 6;
    
    this.doc.text(this.t('PdfGeneration.pgs'), 22, y);
    this.doc.text(`${stats.pgs.toFixed(2)}`, 90, y);
    this.doc.text(
      stats.pgs >= 4.5 
        ? this.t('PdfGeneration.excellentControl') 
        : stats.pgs >= 3.5 
        ? this.t('PdfGeneration.goodControl') 
        : stats.pgs >= 2.5 
        ? this.t('PdfGeneration.mediumControl') 
        : this.t('PdfGeneration.poorControl'),
      120,
      y
    );
    y += 6;
    
    this.doc.text(this.t('PdfGeneration.averageGlucose'), 22, y);
    this.doc.text(`${stats.mean.toFixed(0)} mg/dL`, 90, y);
    y += 6;
    
    this.doc.text(this.t('PdfGeneration.estimatedHbA1c'), 22, y);
    this.doc.text(`${stats.hba1c} %`, 90, y);
    
    return y + 8;
  }

  private addTreatments(stats: StatisticsData, y: number): number {
    // Séparateur
    this.doc.setDrawColor(150);
    this.doc.line(15, y, 195, y);
    
    y += 8;
    this.doc.setFontSize(11);
    this.doc.text(this.t('PdfGeneration.treatments'), 20, y);
    y += 6;
    this.doc.setFontSize(10);
    
    this.doc.text(this.t('PdfGeneration.averageCarbsPerDay'), 22, y);
    this.doc.text(`${(stats.totalGlucides / stats.jours).toFixed(1)} ${this.t('PdfGeneration.gOfCarbs')}`, 90, y);
    y += 6;
    
    this.doc.text(this.t('PdfGeneration.averageInsulinPerDay'), 22, y);
    this.doc.text(`${stats.totalInsuline.toFixed(1)} ${this.t('PdfGeneration.units')}`, 90, y);
    y += 6;
    
    this.doc.text(this.t('PdfGeneration.averageBolusPerDay'), 22, y);
    this.doc.text(`${(stats.totalBolus / stats.jours).toFixed(1)} ${this.t('PdfGeneration.units')}`, 90, y);
    y += 6;
    
    this.doc.text(this.t('PdfGeneration.averageBasalPerDay'), 22, y);
    this.doc.text(`${stats.realBasalPerDay.toFixed(1)} ${this.t('PdfGeneration.units')}`, 90, y);
    
    return y;
  }

  private addGlucoseTrendPage(): void {
    if (!this.date?.from || !this.date?.to) return;
    
    // Grouper les données par jour
    const dayData = new Map<string, NightscoutEntry[]>();
    
    this.data.forEach(entry => {
      if (!entry.sgv && !entry.glucose) return;
      const dateKey = format(new Date(entry.date), "yyyy-MM-dd");
      if (!dayData.has(dateKey)) {
        dayData.set(dateKey, []);
      }
      dayData.get(dateKey)!.push(entry);
    });
    
    // Trier les jours
    const sortedDays = Array.from(dayData.keys()).sort();
    
    // Créer une page pour chaque jour
    sortedDays.forEach((dateKey, index) => {
      this.addSingleDayChart(dateKey, dayData.get(dateKey)!, index === 0);
    });
  }

  private addSingleDayChart(dateKey: string, entries: NightscoutEntry[], isFirstChart: boolean): void {
    // Ajouter une nouvelle page (sauf pour le premier graphique)
    if (!isFirstChart) {
      this.doc.addPage();
    } else {
      this.doc.addPage();
    }
    
    let y = 20;
    
    // Titre de la page
    this.doc.setFontSize(18);
    this.doc.setTextColor(0, 102, 204); // bleu
    this.doc.text("Tendance glycémique", 20, y);
    
    // Date du jour
    const dayDate = new Date(dateKey);
    this.doc.setFontSize(14);
    this.doc.setTextColor(0, 0, 0);
    
    // Format manuel de la date en français
    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const dayName = dayNames[dayDate.getDay()];
    const monthName = monthNames[dayDate.getMonth()];
    const dayOfMonth = dayDate.getDate();
    const year = dayDate.getFullYear();
    
    this.doc.text(`${dayName} ${dayOfMonth} ${monthName} ${year}`, 20, y + 15);
    
    y += 35;
    
    // Zone du graphique - plus grande pour un seul jour
    const chartX = 20;
    const chartY = y;
    const chartWidth = 170;
    const chartHeight = 140;
    
    // Dessiner le cadre du graphique
    this.doc.setDrawColor(200);
    this.doc.setLineWidth(0.5);
    this.doc.rect(chartX, chartY, chartWidth, chartHeight);
    
    // Grille horizontale (mg/dL)
    const minY = 40;
    const maxY = 300;
    const yTicks = [40, 80, 120, 160, 200, 240, 280, 300];
    
    this.doc.setDrawColor(240, 240, 240);
    this.doc.setLineWidth(0.3);
    
    for (const val of yTicks) {
      const yPos = chartY + chartHeight - ((val - minY) / (maxY - minY)) * chartHeight;
      this.doc.line(chartX, yPos, chartX + chartWidth, yPos);
      
      // Labels des valeurs
      this.doc.setFontSize(8);
      this.doc.setTextColor(120, 120, 120);
      this.doc.text(`${val}`, chartX - 15, yPos + 2);
    }
    
    // Grille verticale (heures) - plus détaillée pour un seul jour
    const hourTicks = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24];
    for (const h of hourTicks) {
      const x = chartX + (h / 24) * chartWidth;
      this.doc.line(x, chartY, x, chartY + chartHeight);
      
      // Labels des heures
      this.doc.setFontSize(8);
      this.doc.setTextColor(120, 120, 120);
      this.doc.text(`${h.toString().padStart(2, '0')}:00`, x - 8, chartY + chartHeight + 8);
    }
    
    // Lignes de référence (70 et 180 mg/dL)
    const ref70Y = chartY + chartHeight - ((70 - minY) / (maxY - minY)) * chartHeight;
    const ref180Y = chartY + chartHeight - ((180 - minY) / (maxY - minY)) * chartHeight;
    
    this.doc.setDrawColor(255, 0, 0);
    this.doc.setLineWidth(1);
    this.doc.setLineDashPattern([3, 3], 0);
    this.doc.line(chartX, ref70Y, chartX + chartWidth, ref70Y);
    this.doc.line(chartX, ref180Y, chartX + chartWidth, ref180Y);
    this.doc.setLineDashPattern([], 0); // Reset dash pattern
    
    // Dessiner la courbe de glucose pour ce jour
    this.drawSingleDayGlucoseLine(chartX, chartY, chartWidth, chartHeight, minY, maxY, entries, dayDate);
    
    // Dessiner les traitements pour ce jour
    this.drawSingleDayTreatments(chartX, chartY, chartWidth, chartHeight, minY, maxY, dayDate);
    
    y = chartY + chartHeight + 30;
    
    // Statistiques du jour
    this.addDayStatistics(y, entries, dayDate);
    
    // Légende (seulement sur la première page)
    if (isFirstChart) {
      this.addGlucoseLegend(y + 40);
    }
    
    // Labels des axes
    this.doc.setFontSize(10);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text("mg/dL", 5, chartY + chartHeight / 2, { angle: 90 });
    this.doc.text("Heure", chartX + chartWidth / 2 - 10, chartY + chartHeight + 20);
  }

  private drawSingleDayGlucoseLine(chartX: number, chartY: number, chartWidth: number, chartHeight: number, minY: number, maxY: number, entries: NightscoutEntry[], dayDate: Date): void {
    const points: {x: number, y: number}[] = [];
    
    entries.forEach(entry => {
      const entryDate = new Date(entry.date);
      // Vérifier que l'entrée est bien du bon jour
      if (entryDate.toDateString() === dayDate.toDateString()) {
        const hour = entryDate.getHours() + entryDate.getMinutes() / 60;
        const glucose = entry.sgv || entry.glucose;
        
        if (typeof glucose === 'number' && glucose >= minY && glucose <= maxY) {
          const x = chartX + (hour / 24) * chartWidth;
          const y = chartY + chartHeight - ((glucose - minY) / (maxY - minY)) * chartHeight;
          points.push({x, y});
        }
      }
    });
    
    // Trier les points par heure
    points.sort((a, b) => a.x - b.x);
    
    if (points.length === 0) return;
    
    // Dessiner les lignes entre les points
    this.doc.setDrawColor(59, 130, 246); // Bleu
    this.doc.setLineWidth(1);
    
    for (let i = 0; i < points.length - 1; i++) {
      this.doc.line(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
    }
    
    // Dessiner les points
    this.doc.setFillColor(59, 130, 246);
    points.forEach(point => {
      this.doc.circle(point.x, point.y, 1, "F");
    });
  }

  private drawSingleDayTreatments(chartX: number, chartY: number, chartWidth: number, chartHeight: number, minY: number, maxY: number, dayDate: Date): void {
    const baseY = chartY + chartHeight - ((40 - minY) / (maxY - minY)) * chartHeight;
    
    // Filtrer les traitements pour ce jour spécifique
    const dayTreatments = this.treatments.filter(treatment => {
      const treatmentDate = new Date(treatment.date || treatment.timestamp || '');
      return treatmentDate.toDateString() === dayDate.toDateString();
    });
    
    dayTreatments.forEach(treatment => {
      const treatmentDate = new Date(treatment.date || treatment.timestamp || '');
      const hour = treatmentDate.getHours() + treatmentDate.getMinutes() / 60;
      const x = chartX + (hour / 24) * chartWidth;
      
      // Bolus d'insuline
      if (treatment.insulin && treatment.eventType) {
        const height = (treatment.insulin * 6); // Facteur d'échelle plus grand pour un seul jour
        const topY = baseY - height;
        
        if (treatment.eventType === "Meal Bolus") {
          this.doc.setDrawColor(190, 24, 93); // Rose
          this.doc.setFillColor(190, 24, 93);
        } else {
          this.doc.setDrawColor(16, 185, 129); // Vert
          this.doc.setFillColor(16, 185, 129);
        }
        
        this.doc.setLineWidth(3);
        this.doc.line(x, baseY, x, topY);
        
        // Label
        this.doc.setFontSize(8);
        this.doc.text(`${treatment.insulin}U`, x + 2, topY - 2);
      }
      
      // Glucides
      if (treatment.carbs && treatment.carbs > 0) {
        const height = treatment.carbs * 0.6; // Facteur d'échelle plus grand
        const topY = baseY - height;
        
        this.doc.setDrawColor(245, 158, 11); // Orange
        this.doc.setFillColor(245, 158, 11);
        this.doc.setLineWidth(3);
        this.doc.line(x, baseY, x, topY);
        
        // Label
        this.doc.setFontSize(8);
        this.doc.text(`${treatment.carbs}g`, x + 2, topY - 2);
      }
    });
  }

  private addDayStatistics(y: number, entries: NightscoutEntry[], dayDate: Date): void {
    // Calculer les statistiques pour ce jour
    const values = entries
      .map(e => e.sgv || e.glucose)
      .filter((v): v is number => typeof v === 'number');
    
    if (values.length === 0) return;
    
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const avgVal = values.reduce((a, b) => a + b, 0) / values.length;
    const inRange = values.filter(v => v >= 70 && v <= 180);
    const timeInRange = Math.round((inRange.length / values.length) * 100);
    
    // Traitements du jour
    const dayTreatments = this.treatments.filter(treatment => {
      const treatmentDate = new Date(treatment.date || treatment.timestamp || '');
      return treatmentDate.toDateString() === dayDate.toDateString();
    });
    
    const totalCarbs = dayTreatments.reduce((sum, t) => sum + (t.carbs || 0), 0);
    const totalInsulin = dayTreatments.reduce((sum, t) => sum + (t.insulin || 0), 0);
    
    // Afficher les statistiques
    this.doc.setFontSize(10);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text("Statistiques du jour :", 22, y);
    
    y += 8;
    this.doc.setFontSize(9);
    this.doc.text(`• Glycémie moyenne : ${avgVal.toFixed(0)} mg/dL`, 25, y);
    y += 6;
    this.doc.text(`• Min : ${minVal} mg/dL - Max : ${maxVal} mg/dL`, 25, y);
    y += 6;
    this.doc.text(`• Temps dans la cible (70-180) : ${timeInRange}%`, 25, y);
    y += 6;
    this.doc.text(`• Glucides totaux : ${totalCarbs}g`, 25, y);
    y += 6;
    this.doc.text(`• Insuline totale : ${totalInsulin.toFixed(1)}U`, 25, y);
  }

  private addGlucoseLegend(y: number): void {
    this.doc.setFontSize(10);
    this.doc.setTextColor(0, 0, 0);
    
    const legendY = y + 10;
    let x = 25;
    
    // Ligne de glucose
    this.doc.setDrawColor(59, 130, 246);
    this.doc.setLineWidth(2);
    this.doc.line(x, legendY, x + 15, legendY);
    this.doc.text("Glucose", x + 20, legendY + 2);
    x += 70;
    
    // Bolus repas
    this.doc.setDrawColor(190, 24, 93);
    this.doc.setLineWidth(2);
    this.doc.line(x, legendY - 3, x, legendY + 3);
    this.doc.text("Bolus Repas", x + 5, legendY + 2);
    x += 70;
    
    // Bolus correction
    this.doc.setDrawColor(16, 185, 129);
    this.doc.setLineWidth(2);
    this.doc.line(x, legendY - 3, x, legendY + 3);
    this.doc.text("Bolus Correction", x + 5, legendY + 2);
    
    // Deuxième ligne
    x = 25;
    const legendY2 = legendY + 15;
    
    // Glucides
    this.doc.setDrawColor(245, 158, 11);
    this.doc.setLineWidth(2);
    this.doc.line(x, legendY2 - 3, x, legendY2 + 3);
    this.doc.text("Glucides", x + 5, legendY2 + 2);
    x += 70;
    
    // Lignes de référence
    this.doc.setDrawColor(255, 0, 0);
    this.doc.setLineWidth(1);
    this.doc.setLineDashPattern([3, 3], 0);
    this.doc.line(x, legendY2, x + 15, legendY2);
    this.doc.setLineDashPattern([], 0);
    this.doc.text("Cibles (70-180 mg/dL)", x + 20, legendY2 + 2);
  }

  private addVariabilityChart(): void {
    // Ajouter une nouvelle page
    this.doc.addPage();
    
    let y = 20;
    
    // Titre de la page
    this.doc.setFontSize(18);
    this.doc.setTextColor(0, 102, 204); // bleu
    this.doc.text("Profil de variabilité glycémique", 20, y);
    
    // Informations sur la période
    const from = this.date?.from ? format(this.date.from, "dd/MM/yyyy") : "-";
    const toDate = this.date?.to ? format(this.date.to, "dd/MM/yyyy") : "-";
    this.doc.setFontSize(10);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(`Période : ${from} au ${toDate}`, 20, y + 15);
    
    y += 35;
    
    // Zone du graphique - même taille que les graphiques quotidiens
    const chartX = 20;
    const chartY = y;
    const chartWidth = 170;
    const chartHeight = 140;
    
    // Dessiner le cadre du graphique
    this.doc.setDrawColor(200);
    this.doc.setLineWidth(0.5);
    this.doc.rect(chartX, chartY, chartWidth, chartHeight);
    
    // Grille horizontale (mg/dL)
    const minY = 40;
    const maxY = 300;
   
    
    // Lignes de référence (70 et 180 mg/dL)
    const ref70Y = chartY + chartHeight - ((70 - minY) / (maxY - minY)) * chartHeight;
    const ref180Y = chartY + chartHeight - ((180 - minY) / (maxY - minY)) * chartHeight;
    
    this.doc.setDrawColor(255, 0, 0);
    this.doc.setLineWidth(1);
    this.doc.setLineDashPattern([3, 3], 0);
    // this.doc.line(chartX, ref70Y, chartX + chartWidth, ref70Y);
    // this.doc.line(chartX, ref180Y, chartX + chartWidth, ref180Y);
    this.doc.setLineDashPattern([], 0); // Reset dash pattern
    
    // Zone cible (70-180 mg/dL) en vert très clair
    this.doc.setFillColor(144, 238, 144); // Vert clair avec transparence
    this.doc.rect(chartX, ref180Y, chartWidth, ref70Y - ref180Y, "F");
    
    // Dessiner la courbe des moyennes de glycémie par heure
    this.drawGlucoseAverageCurve(chartX, chartY, chartWidth, chartHeight, minY, maxY);


    this.doc.setFillColor(0, 0, 0);

    const yTicks = [40, 80, 120, 160, 200, 240, 280, 300];
    
    this.doc.setDrawColor(240, 240, 240);
    this.doc.setLineWidth(0.3);
    
    for (const val of yTicks) {
      const yPos = chartY + chartHeight - ((val - minY) / (maxY - minY)) * chartHeight;
      this.doc.line(chartX, yPos, chartX + chartWidth, yPos);
      
      // Labels des valeurs
      this.doc.setFontSize(8);
      this.doc.setTextColor(120, 120, 120);
      this.doc.text(`${val}`, chartX - 15, yPos + 2);
    }
    
    // Grille verticale (heures) - toutes les 2 heures
    const hourTicks = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24];
    for (const h of hourTicks) {
      const x = chartX + (h / 24) * chartWidth;
      this.doc.line(x, chartY, x, chartY + chartHeight);
      
      // Labels des heures
      this.doc.setFontSize(8);
      this.doc.setTextColor(120, 120, 120);
      this.doc.text(`${h.toString().padStart(2, '0')}:00`, x - 8, chartY + chartHeight + 8);
    }
    
    y = chartY + chartHeight + 20;
    
    // Statistiques de variabilité
    this.addVariabilityStatistics(y);
    
    // Légende
    this.addVariabilityLegend(y + 40);
    
    // Labels des axes
    this.doc.setFontSize(10);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text("mg/dL", 5, chartY + chartHeight / 2, { angle: 90 });
    this.doc.text("Heure de la journée", chartX + chartWidth / 2 - 25, chartY + chartHeight + 20);
  }

  private drawGlucoseAverageCurve(chartX: number, chartY: number, chartWidth: number, chartHeight: number, minY: number, maxY: number): void {
    // Calculer les percentiles et moyennes de glycémie
    const glucoseData = this.calculateGlucosePercentiles();
    
    // Points pour dessiner les courbes
    const avgPoints: { x: number, y: number }[] = [];
    const p10Points: { x: number, y: number }[] = [];
    const p25Points: { x: number, y: number }[] = [];
    const p75Points: { x: number, y: number }[] = [];
    const p90Points: { x: number, y: number }[] = [];
    
    // Calculer les coordonnées de chaque point (par intervalles de 5 minutes)
    for (let interval = 0; interval < 288; interval++) { // 24h * 60min / 5min = 288 intervalles
      const avgGlucose = glucoseData.averages[interval];
      const p10Glucose = glucoseData.p10[interval];
      const p25Glucose = glucoseData.p25[interval];
      const p75Glucose = glucoseData.p75[interval];
      const p90Glucose = glucoseData.p90[interval];
      
      if (avgGlucose > 0) { // Seulement si on a des données pour cet intervalle
        const timeRatio = interval / 288; // Ratio par rapport à 24h
        const x = chartX + timeRatio * chartWidth;
        
        // Coordonnées Y pour chaque courbe
        const avgY = chartY + chartHeight - ((avgGlucose - minY) / (maxY - minY)) * chartHeight;
        const p10Y = chartY + chartHeight - ((p10Glucose - minY) / (maxY - minY)) * chartHeight;
        const p25Y = chartY + chartHeight - ((p25Glucose - minY) / (maxY - minY)) * chartHeight;
        const p75Y = chartY + chartHeight - ((p75Glucose - minY) / (maxY - minY)) * chartHeight;
        const p90Y = chartY + chartHeight - ((p90Glucose - minY) / (maxY - minY)) * chartHeight;
        
        avgPoints.push({ x, y: avgY });
        p10Points.push({ x, y: p10Y });
        p25Points.push({ x, y: p25Y });
        p75Points.push({ x, y: p75Y });
        p90Points.push({ x, y: p90Y });
      }
    }
    
    // Dessiner la zone de variabilité 10-90% (en premier, couleur plus foncée)
    if (p10Points.length >= 2 && p90Points.length >= 2) {
      this.doc.setFillColor(0, 51, 153); // Bleu foncé
      this.doc.setDrawColor(0, 51, 153);

      // Concaténer les points du polygone (P90 puis P10 à l'envers)
      const allPoints = [...p90Points, ...p10Points.slice().reverse()];

      // Convertir en vecteurs relatifs pour jsPDF.lines
      const relVectors = [];
      for (let i = 1; i < allPoints.length; i++) {
        relVectors.push([allPoints[i].x - allPoints[i - 1].x, allPoints[i].y - allPoints[i - 1].y]);
      }

      // Appel à lines : point de départ absolu, vecteurs relatifs, scale, style, closed
      this.doc.lines(relVectors, allPoints[0].x, allPoints[0].y, [1, 1], 'F', true);
    }
    // Dessiner la zone de variabilité (entre P25 et P75)
    if (p25Points.length >= 2 && p75Points.length >= 2) {
      this.doc.setFillColor(173, 216, 230); // Bleu clair
      this.doc.setDrawColor(173, 216, 230);

      // Concaténer les points du polygone (P75 puis P25 à l'envers)
      const allPoints = [...p75Points, ...p25Points.reverse()];

      // Convertir en vecteurs relatifs pour jsPDF.lines
      const relVectors = [];
      for (let i = 1; i < allPoints.length; i++) {
        relVectors.push([allPoints[i].x - allPoints[i - 1].x, allPoints[i].y - allPoints[i - 1].y]);
      }

      // Appel à lines : point de départ absolu, vecteurs relatifs, scale, style, closed
      this.doc.lines(relVectors, allPoints[0].x, allPoints[0].y, [1, 1], 'F', true);
    }
    // Dessiner la courbe moyenne par-dessus
    if (avgPoints.length >= 2) {
      this.doc.setDrawColor(255, 69, 0); // Rouge-orangé pour la courbe de glycémie moyenne
      this.doc.setLineWidth(0.5);
      // Dessiner les segments de la courbe moyenne
      for (let i = 0; i < avgPoints.length - 1; i++) {
        this.doc.line(avgPoints[i].x, avgPoints[i].y, avgPoints[i + 1].x, avgPoints[i + 1].y);
      }
      // Dessiner des petits cercles aux points de données moyennes
      this.doc.setFillColor(255, 69, 0);
      avgPoints.forEach((point, index) => {
        if (index % 12 === 0) { // Afficher un point toutes les heures (12 intervalles de 5min)
          this.doc.circle(point.x, point.y, 0.5, "F");
        }
      });
    }
  }

  private calculateGlucosePercentiles(): { p10: number[], p25: number[], p75: number[], p90: number[], averages: number[] } {
    // 288 intervalles de 5 minutes (24h * 60min / 5min = 288)
    const intervalData = new Array(288).fill(0).map(() => ({ values: [] as number[] }));
    
    // Grouper les données de glycémie par intervalles de 5 minutes
    this.data.forEach(entry => {
      const entryDate = new Date(entry.date);
      const totalMinutes = entryDate.getHours() * 60 + entryDate.getMinutes();
      const intervalIndex = Math.floor(totalMinutes / 5); // Intervalle de 5 minutes
      
      if (entry.sgv && entry.sgv > 0 && intervalIndex < 288) {
        intervalData[intervalIndex].values.push(entry.sgv);
      }
    });
    
    // Calculer les percentiles et moyennes pour chaque intervalle
    const p10Array: number[] = [];
    const p25Array: number[] = [];
    const p75Array: number[] = [];
    const p90Array: number[] = [];
    const averagesArray: number[] = [];
    
    intervalData.forEach(data => {
      if (data.values.length > 0) {
        // Trier les valeurs
        const sortedValues = data.values.sort((a, b) => a - b);
        const n = sortedValues.length;
        
        // Calculer les percentiles
        const p10Index = Math.floor(n * 0.10);
        const p25Index = Math.floor(n * 0.25);
        const p75Index = Math.floor(n * 0.75);
        const p90Index = Math.floor(n * 0.90);
        
        p10Array.push(sortedValues[p10Index] || 0);
        p25Array.push(sortedValues[p25Index] || 0);
        p75Array.push(sortedValues[p75Index] || 0);
        p90Array.push(sortedValues[p90Index] || 0);
        
        // Calculer la moyenne
        const average = sortedValues.reduce((sum, val) => sum + val, 0) / n;
        averagesArray.push(average);
      } else {
        p10Array.push(0);
        p25Array.push(0);
        p75Array.push(0);
        p90Array.push(0);
        averagesArray.push(0);
      }
    });
    
    return { p10: p10Array, p25: p25Array, p75: p75Array, p90: p90Array, averages: averagesArray };
  }

  private addVariabilityStatistics(y: number): void {
    this.doc.setFontSize(11);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text("Analyse de variabilité :", 22, y);
    
    y += 10;
    this.doc.setFontSize(9);
    
    // Heure avec le plus d'activité
    const mostActiveHour = this.findMostActiveHour();
    this.doc.text(`• Heure la plus active : ${mostActiveHour.hour}h00 (${mostActiveHour.count} traitements)`, 25, y);
    y += 6;
    
    // Moyenne d'insuline par jour
    const avgInsulinPerDay = this.calculateAverageInsulinPerDay();
    this.doc.text(`• Insuline moyenne par jour : ${avgInsulinPerDay.toFixed(1)}U`, 25, y);
    y += 6;
    
    // Moyenne de glucides par jour
    const avgCarbsPerDay = this.calculateAverageCarbsPerDay();
    this.doc.text(`• Glucides moyens par jour : ${avgCarbsPerDay.toFixed(0)}g`, 25, y);
    y += 6;
    
    // Période la plus chargée
    const busiestPeriod = this.findBusiestPeriod();
    this.doc.text(`• Période la plus chargée : ${busiestPeriod.start}h-${busiestPeriod.end}h`, 25, y);
  }

  private calculateHourlyStats() {
    const hourlyData = new Array(24).fill(0).map(() => ({ treatments: 0, insulin: 0, carbs: 0 }));
    
    this.treatments.forEach(treatment => {
      const treatmentDate = new Date(treatment.date || treatment.timestamp || '');
      const hour = treatmentDate.getHours();
      
      hourlyData[hour].treatments++;
      if (treatment.insulin) hourlyData[hour].insulin += treatment.insulin;
      if (treatment.carbs) hourlyData[hour].carbs += treatment.carbs;
    });
    
    return hourlyData;
  }

  private findMostActiveHour() {
    const hourlyStats = this.calculateHourlyStats();
    let maxCount = 0;
    let maxHour = 0;
    
    hourlyStats.forEach((stats, hour) => {
      if (stats.treatments > maxCount) {
        maxCount = stats.treatments;
        maxHour = hour;
      }
    });
    
    return { hour: maxHour, count: maxCount };
  }

  private calculateAverageInsulinPerDay(): number {
    if (!this.date?.from || !this.date?.to) return 0;
    
    const totalInsulin = this.treatments.reduce((sum, t) => sum + (t.insulin || 0), 0);
    const daysDiff = Math.ceil((this.date.to.getTime() - this.date.from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    return totalInsulin / daysDiff;
  }

  private calculateAverageCarbsPerDay(): number {
    if (!this.date?.from || !this.date?.to) return 0;
    
    const totalCarbs = this.treatments.reduce((sum, t) => sum + (t.carbs || 0), 0);
    const daysDiff = Math.ceil((this.date.to.getTime() - this.date.from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    return totalCarbs / daysDiff;
  }

  private findBusiestPeriod() {
    const hourlyStats = this.calculateHourlyStats();
    let maxSum = 0;
    let bestStart = 0;
    
    // Chercher la période de 4h consécutives avec le plus de traitements
    for (let start = 0; start < 20; start++) {
      let sum = 0;
      for (let i = 0; i < 4; i++) {
        sum += hourlyStats[start + i].treatments;
      }
      if (sum > maxSum) {
        maxSum = sum;
        bestStart = start;
      }
    }
    
    return { start: bestStart, end: bestStart + 4 };
  }

  private addVariabilityLegend(y: number): void {
    this.doc.setFontSize(10);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text("Légende :", 22, y);
    
    y += 8;
    const legendY = y;
    let x = 25;
    
    // Courbe de glycémie moyenne
    this.doc.setDrawColor(255, 69, 0);
    this.doc.setLineWidth(2);
    this.doc.line(x, legendY, x + 15, legendY);
    this.doc.setFillColor(255, 69, 0);
    this.doc.circle(x + 7, legendY, 1.5, "F");
    this.doc.setFontSize(9);
    this.doc.text("Courbe de glycémie moyenne (5min)", x + 20, legendY + 2);
    
    // Zone 10-90% (nouvelle ligne)
    x = 25;
    y += 10;
    this.doc.setFillColor(0, 51, 153); // Bleu foncé
    this.doc.rect(x, y - 2, 15, 4, "F");
    this.doc.setDrawColor(0, 51, 153);
    this.doc.setLineWidth(0.3);
    this.doc.rect(x, y - 2, 15, 4, "S");
    this.doc.text("Zone de variabilité (10%-90%)", x + 20, y + 2);
    
    // Zone de variabilité (nouvelle ligne)
    x = 25;
    y += 10;
    this.doc.setFillColor(173, 216, 230); // Bleu clair
    this.doc.rect(x, y - 2, 15, 4, "F");
    this.doc.setDrawColor(173, 216, 230);
    this.doc.setLineWidth(0.3);
    this.doc.rect(x, y - 2, 15, 4, "S");
    this.doc.text("Zone de variabilité (25%-75%)", x + 20, y + 2);
    
    // Zone cible (nouvelle ligne)
    x = 25;
    y += 10;
    this.doc.setFillColor(144, 238, 144);
    this.doc.rect(x, y - 2, 15, 4, "F");
    this.doc.setDrawColor(100, 100, 100);
    this.doc.setLineWidth(0.5);
    this.doc.rect(x, y - 2, 15, 4, "S");
    this.doc.text("Zone cible (70-180 mg/dL)", x + 20, y + 2);
  }

  public generate(infos: PatientInfo): void {
    const stats = this.calculateStatistics();
    
    let y = this.addHeader();
    y = this.addPatientInfo(infos, y);
    y = this.addBasicStats(stats, y);
    y = this.addTargetZone(stats, y);
    y = this.addPeriodStats(stats, y);
    this.addTreatments(stats, y);
    
    // Ajouter les graphiques quotidiens uniquement si l'option est activée
    if (infos.includeCharts) {
      this.addGlucoseTrendPage();
    }
    
    // Ajouter le graphique de variabilité si l'option est activée
    if (infos.includeVariabilityChart) {
      this.addVariabilityChart();
    }
    
    // Ouvrir le PDF dans un nouvel onglet
    window.open(this.doc.output("bloburl"), "_blank");
  }
}

// Fonction utilitaire pour générer le PDF
export function generateNightscoutPdf(
  data: PdfGenerationData,
  patientInfo: PatientInfo,
  translateFunction: (key: string) => string
): void {
  const generator = new NightscoutPdfGenerator(data, translateFunction);
  generator.generate(patientInfo);
}
