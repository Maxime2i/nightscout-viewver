import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/components/I18nProvider";
import { Analytics } from "@/components/Analytics";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next"


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "DiabExplorer - Visualisateur de données de glycémie",
    template: "%s | DiabExplorer"
  },
  description: "Analysez et visualisez vos données de glycémie Nightscout avec des graphiques interactifs, des statistiques détaillées et des rapports PDF. Outil gratuit pour le suivi du diabète.",
  keywords: [
    "nightscout",
    "diabète",
    "glycémie",
    "glucose",
    "suivi diabète",
    "CGM",
    "freestyle libre",
    "dexcom",
    "visualisation données",
    "rapport diabète",
    "statistiques glycémie"
  ],
  authors: [{ name: "DiabExplorer Team" }],
  creator: "DiabExplorer",
  publisher: "DiabExplorer",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://diabexplorer.com"),
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "/",
    siteName: "DiabExplorer",
    title: "DiabExplorer - Visualisateur de données de glycémie",
    description: "Analysez et visualisez vos données de glycémie Nightscout avec des graphiques interactifs, des statistiques détaillées et des rapports PDF.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "DiabExplorer - Dashboard de glycémie",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DiabExplorer - Visualisateur de données de glycémie",
    description: "Analysez et visualisez vos données de glycémie Nightscout avec des graphiques interactifs, des statistiques détaillées et des rapports PDF.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "DiabExplorer",
    "description": "Analysez et visualisez vos données de glycémie Nightscout avec des graphiques interactifs, des statistiques détaillées et des rapports PDF.",
    "url": process.env.NEXT_PUBLIC_BASE_URL || "https://nightscout-viewer.vercel.app",
    "applicationCategory": "HealthApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "EUR"
    },
    "author": {
      "@type": "Organization",
      "name": "DiabExplorer Team"
    },
    "potentialAction": {
      "@type": "UseAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": process.env.NEXT_PUBLIC_BASE_URL || "https://nightscout-viewer.vercel.app"
      }
    }
  };

  return (
    <html lang="fr">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd),
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <I18nProvider>
          {children}
        </I18nProvider>
        <Analytics />
        <VercelAnalytics />
      </body>
    </html>
  );
}
