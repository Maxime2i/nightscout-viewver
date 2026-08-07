"use client";

import { useTranslation } from "react-i18next";
import { HeartPulse, Users, Stethoscope, Check } from "lucide-react";

const icons = [HeartPulse, Users, Stethoscope];

interface ForWhomCard {
  title: string;
  description: string;
  bullets: string[];
}

export function ForWhom() {
  const { t } = useTranslation("common");
  const cards = t("Landing.forWhom.cards", {
    returnObjects: true,
  }) as unknown as ForWhomCard[];

  return (
    <section
      id="pour-qui"
      aria-labelledby="forwhom-title"
      className="bg-slate-50 py-16 sm:py-24"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">
            {t("Landing.forWhom.kicker")}
          </p>
          <h2
            id="forwhom-title"
            className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
          >
            {t("Landing.forWhom.title")}
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            {t("Landing.forWhom.subtitle")}
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {cards.map((card, index) => {
            const Icon = icons[index] ?? HeartPulse;
            return (
              <div
                key={card.title}
                className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-700 text-white">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-900">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {card.description}
                </p>
                <ul className="mt-5 space-y-2.5">
                  {card.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="flex items-start gap-2.5 text-sm text-slate-700"
                    >
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-teal-700"
                        aria-hidden="true"
                      />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
