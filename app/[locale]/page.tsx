import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const isFr = locale === "fr";

  return {
    title: isFr
      ? "Visualisez vos données de glycémie"
      : "Visualize your glucose data",
    description: isFr
      ? "Courbes temps réel, Time in Range, statistiques détaillées et export PDF : connectez votre serveur Nightscout et comprenez votre glycémie en un coup d'œil."
      : "Real-time charts, Time in Range, detailed statistics and PDF export: connect your Nightscout server and understand your glucose at a glance.",
    alternates: {
      canonical: `/${locale}`,
    },
  };
}

export default async function LocalizedLanding({ params }: PageProps) {
  const { locale } = await params;

  return <LandingPage locale={locale} />;
}
