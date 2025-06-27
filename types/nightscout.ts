// Types pour les données Nightscout

export interface NightscoutEntry {
  _id: string;
  date: number;
  sgv: number;
  glucose?: number;
  direction: string;
  trend: number;
  device?: string;
  type?: string;
}

export interface NightscoutTreatment {
  _id: string;
  eventType: string;
  created_at: string;
  timestamp: string;
  date: string;
  identifier?: string;
  enteredBy?: string;
  carbs?: number;
  insulin?: number;
  glucose?: number;
  glucoseType?: string;
  units?: string;
  notes?: string;
  duration: number;
  percent?: number;
  absolute?: number;
  rate?: number;
}

export interface NightscoutProfile {
  _id: string;
  date?: number; // Ajout pour la compatibilité avec les tableaux de profils
  defaultProfile: string;
  store: {
    [key: string]: {
      dia: number;
      carbratio: Array<{
        time: string;
        value: number;
        timeAsSeconds: number;
      }>;
      carbs_hr: number;
      delay: number;
      sens: Array<{
        time: string;
        value: number;
        timeAsSeconds: number;
      }>;
      timezone: string;
      basal: Array<{
        time: string;
        value: number;
        timeAsSeconds: number;
      }>;
      target_low: Array<{
        time: string;
        value: number;
        timeAsSeconds: number;
      }>;
      target_high: Array<{
        time: string;
        value: number;
        timeAsSeconds: number;
      }>;
      startDate: string;
      mills: number;
      units: string;
    };
  };
}

export interface ChartDataPoint {
  time: string;
  glucose: number;
  direction?: string;
  trend?: number;
  timestamp: number;
}

export interface TreatmentChartData {
  time: string;
  carbs?: number;
  insulin?: number;
  timestamp: number;
  eventType: string;
  notes?: string;
}

export interface DailyStatsData {
  date: string;
  avg: number;
  min: number;
  max: number;
  count: number;
  timeInRange: {
    low: number;
    target: number;
    high: number;
  };
}

export interface StatsData {
  average: number;
  min: number;
  max: number;
  timeInRange: {
    low: number;
    target: number;
    high: number;
  };
  standardDeviation: number;
  coefficient: number;
  totalReadings: number;
}
