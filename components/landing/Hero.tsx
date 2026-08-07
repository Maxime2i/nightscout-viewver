"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Activity, ArrowRight } from "lucide-react";
import { GlucoseChartMock } from "./GlucoseChartMock";

export function Hero({ locale }: { locale: string }) {
  const { t } = useTranslation("common");

  const chips = [
    { label: t("Landing.hero.chipTir"), value: t("Landing.hero.chipTirValue") },
    { label: t("Landing.hero.chipAvg"), value: t("Landing.hero.chipAvgValue") },
    { label: t("Landing.hero.chipLast"), value: t("Landing.hero.chipLastValue") },
  ];

  return (
    <section id="accueil" className="relative overflow-hidden">
      {/* Décor doux */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 right-0 h-96 w-96 rounded-full bg-teal-100/60 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-40 h-80 w-80 rounded-full bg-emerald-100/50 blur-3xl"
      />

      <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-28">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-800">
            <Activity className="h-3.5 w-3.5" aria-hidden="true" />
            {t("Landing.hero.badge")}
          </p>
          <h1
            id="hero-title"
            className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl"
          >
            {t("Landing.hero.title1")}{" "}
            <span className="text-teal-700">{t("Landing.hero.titleAccent")}</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
            {t("Landing.hero.subtitle")}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-lg bg-teal-700 px-7 text-base font-semibold shadow-lg shadow-teal-700/25 transition-all hover:bg-teal-600 hover:shadow-teal-600/30"
            >
              <Link href={`/${locale}/login`}>
                {t("Landing.hero.ctaPrimary")}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-lg border-slate-300 bg-white px-7 text-base font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              <a href="#fonctionnalites">{t("Landing.hero.ctaSecondary")}</a>
            </Button>
          </div>
          <p className="mt-6 text-sm text-slate-500">{t("Landing.hero.trust")}</p>
        </div>

        {/* Mockup de courbe */}
        <div className="relative">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5 sm:p-6">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-500 opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-teal-600" />
              </span>
              <span className="text-sm font-semibold text-slate-900">
                {t("Landing.hero.chartTitle")}
              </span>
              <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-teal-700">
                {t("Landing.hero.chartLive")}
              </span>
            </div>
            <GlucoseChartMock />
            <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4">
              {chips.map((chip) => (
                <div key={chip.label}>
                  <dt className="text-[11px] font-medium text-slate-500">
                    {chip.label}
                  </dt>
                  <dd className="mt-0.5 text-sm font-semibold text-slate-900">
                    {chip.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
