"use client";

import { useTranslation } from "react-i18next";
import "../../i18n";
import { LandingHeader } from "./LandingHeader";
import { Hero } from "./Hero";
import { HowItWorks } from "./HowItWorks";
import { Features } from "./Features";
import { ForWhom } from "./ForWhom";
import { CtaBand } from "./CtaBand";
import { LandingFooter } from "./LandingFooter";

export function LandingPage({ locale }: { locale: string }) {
  const { i18n } = useTranslation("common");

  // Synchroniser la langue avec la locale de l'URL
  if (locale && i18n.language !== locale) {
    i18n.changeLanguage(locale);
  }

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <LandingHeader locale={locale} />
      <main className="flex-1">
        <Hero locale={locale} />
        <HowItWorks />
        <Features />
        <ForWhom />
        <CtaBand locale={locale} />
      </main>
      <LandingFooter locale={locale} />
    </div>
  );
}
