"use client";

import { useTranslation } from "react-i18next";
import { Link2, LineChart, Send } from "lucide-react";

const icons = [Link2, LineChart, Send];

interface HowItWorksStep {
  title: string;
  description: string;
}

export function HowItWorks() {
  const { t } = useTranslation("common");
  const steps = t("Landing.how.steps", {
    returnObjects: true,
  }) as unknown as HowItWorksStep[];

  return (
    <section
      id="comment-ca-marche"
      aria-labelledby="how-title"
      className="bg-slate-50 py-16 sm:py-24"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">
            {t("Landing.how.kicker")}
          </p>
          <h2
            id="how-title"
            className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
          >
            {t("Landing.how.title")}
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            {t("Landing.how.subtitle")}
          </p>
        </div>

        <ol className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = icons[index] ?? Link2;
            return (
              <li
                key={step.title}
                className="relative rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition-shadow hover:shadow-md"
              >
                <span
                  aria-hidden="true"
                  className="absolute right-6 top-6 text-4xl font-bold text-slate-100"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {step.description}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
