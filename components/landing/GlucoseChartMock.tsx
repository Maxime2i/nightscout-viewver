"use client";

import { useTranslation } from "react-i18next";

interface GlucosePoint {
  hour: number;
  value: number;
}

interface Point {
  x: number;
  y: number;
}

// Courbe glycémique simulée sur 24 h (mg/dL) — réaliste mais purement décorative
const DATA: GlucosePoint[] = [
  { hour: 0, value: 150 },
  { hour: 2, value: 165 },
  { hour: 4, value: 175 },
  { hour: 6, value: 120 },
  { hour: 8, value: 95 },
  { hour: 10, value: 105 },
  { hour: 12, value: 160 },
  { hour: 14, value: 140 },
  { hour: 16, value: 110 },
  { hour: 18, value: 90 },
  { hour: 20, value: 130 },
  { hour: 22, value: 170 },
  { hour: 24, value: 140 },
];

const WIDTH = 560;
const HEIGHT = 260;
const PAD_TOP = 20;
const PAD_BOTTOM = 30;
const MIN_VALUE = 40;
const MAX_VALUE = 220;

function toPoint(p: GlucosePoint): Point {
  const x = (p.hour / 24) * WIDTH;
  const y =
    PAD_TOP +
    ((MAX_VALUE - p.value) / (MAX_VALUE - MIN_VALUE)) *
      (HEIGHT - PAD_TOP - PAD_BOTTOM);
  return { x, y };
}

// Lissage Catmull-Rom -> courbes de Bézier cubiques
function buildSmoothPath(points: Point[]): string {
  if (points.length < 2) return "";
  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

const AXIS_LABELS = [
  { hour: 0, key: "axis00" },
  { hour: 6, key: "axis06" },
  { hour: 12, key: "axis12" },
  { hour: 18, key: "axis18" },
  { hour: 24, key: "axis00" },
];

export function GlucoseChartMock() {
  const { t } = useTranslation("common");

  const points = DATA.map(toPoint);
  const linePath = buildSmoothPath(points);
  const areaPath = `${linePath} L ${WIDTH} ${HEIGHT} L 0 ${HEIGHT} Z`;
  const last = points[points.length - 1];

  // Zone cible 70-180 mg/dL
  const bandTop = toPoint({ hour: 0, value: 180 }).y;
  const bandBottom = toPoint({ hour: 0, value: 70 }).y;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={t("Landing.hero.chartAria")}
      className="h-auto w-full"
    >
      <defs>
        <linearGradient id="landing-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0d9488" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#0d9488" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Zone cible */}
      <rect
        x="0"
        y={bandTop}
        width={WIDTH}
        height={bandBottom - bandTop}
        fill="#ecfdf5"
        rx="6"
      />
      <line
        x1="0"
        y1={bandTop}
        x2={WIDTH}
        y2={bandTop}
        stroke="#6ee7b7"
        strokeWidth="1"
        strokeDasharray="4 4"
      />
      <line
        x1="0"
        y1={bandBottom}
        x2={WIDTH}
        y2={bandBottom}
        stroke="#6ee7b7"
        strokeWidth="1"
        strokeDasharray="4 4"
      />

      {/* Grille verticale */}
      {[6, 12, 18].map((hour) => {
        const x = (hour / 24) * WIDTH;
        return (
          <line
            key={hour}
            x1={x}
            y1={PAD_TOP}
            x2={x}
            y2={HEIGHT - PAD_BOTTOM}
            stroke="#e2e8f0"
            strokeWidth="1"
          />
        );
      })}

      {/* Aire sous la courbe */}
      <path d={areaPath} fill="url(#landing-area)" />

      {/* Courbe */}
      <path
        d={linePath}
        fill="none"
        stroke="#0d9488"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Dernier point + libellé */}
      <circle cx={last.x} cy={last.y} r="7" fill="#0d9488" opacity="0.18" />
      <circle
        cx={last.x}
        cy={last.y}
        r="4.5"
        fill="#ffffff"
        stroke="#0d9488"
        strokeWidth="3"
      />
      <g transform={`translate(${last.x - 104}, ${last.y - 36})`}>
        <rect width="92" height="26" rx="13" fill="#0f172a" />
        <text
          x="46"
          y="17"
          textAnchor="middle"
          fontSize="12"
          fontWeight="600"
          fill="#ffffff"
        >
          {t("Landing.hero.chartValue")} {t("Landing.hero.chartUnit")}
        </text>
      </g>

      {/* Axe des abscisses */}
      {AXIS_LABELS.map(({ hour, key }) => (
        <text
          key={`${key}-${hour}`}
          x={(hour / 24) * WIDTH}
          y={HEIGHT - 8}
          textAnchor="middle"
          fontSize="10"
          fill="#94a3b8"
        >
          {t(`Landing.hero.${key}`)}
        </text>
      ))}
    </svg>
  );
}
