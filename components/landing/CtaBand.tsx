"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CtaBand({ locale }: { locale: string }) {
  const { t } = useTranslation("common");

  return (
    <section aria-labelledby="cta-title" className="bg-white py-16 sm:py-24">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-14 text-center sm:px-12 sm:py-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-teal-500/20 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-teal-700/20 blur-3xl"
          />
          <h2
            id="cta-title"
            className="relative text-3xl font-bold tracking-tight text-white sm:text-4xl"
          >
            {t("Landing.cta.title")}
          </h2>
          <p className="relative mx-auto mt-4 max-w-2xl text-lg text-slate-300">
            {t("Landing.cta.subtitle")}
          </p>
          <div className="relative mt-8">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-lg bg-teal-600 px-8 text-base font-semibold text-white shadow-lg shadow-teal-950/40 transition-colors hover:bg-teal-500"
            >
              <Link href={`/${locale}/login`}>
                {t("Landing.cta.button")}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
