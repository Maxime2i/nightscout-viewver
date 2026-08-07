"use client";

import { useTranslation } from "react-i18next";
import {
  Activity,
  TrendingUp,
  Target,
  BarChart3,
  FileDown,
  ArrowLeftRight,
} from "lucide-react";

const icons = [Activity, TrendingUp, Target, BarChart3, FileDown, ArrowLeftRight];

interface FeatureItem {
  title: string;
  description: string;
}

export function Features() {
  const { t } = useTranslation("common");
  const items = t("Landing.features.items", {
    returnObjects: true,
  }) as unknown as FeatureItem[];

  return (
    <section
      id="fonctionnalites"
      aria-labelledby="features-title"
      className="bg-white py-16 sm:py-24"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">
            {t("Landing.features.kicker")}
          </p>
          <h2
            id="features-title"
            className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
          >
            {t("Landing.features.title")}
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            {t("Landing.features.subtitle")}
          </p>
        </div>

        <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => {
            const Icon = icons[index] ?? Activity;
            return (
              <li
                key={item.title}
                className="group rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition-all hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700 transition-colors group-hover:bg-teal-700 group-hover:text-white">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {item.description}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
