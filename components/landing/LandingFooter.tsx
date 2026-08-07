"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { Github, ExternalLink } from "lucide-react";

interface LandingFooterProps {
  locale: string;
}

export function LandingFooter({ locale }: LandingFooterProps) {
  const { t } = useTranslation("common");
  const year = new Date().getFullYear();

  const productLinks = [
    { key: "features", href: "#fonctionnalites" },
    { key: "how", href: "#comment-ca-marche" },
    { key: "forWhom", href: "#pour-qui" },
    { key: "login", href: `/${locale}/login` },
  ];

  const resourceLinks = [
    {
      key: "nightscout",
      href: "https://nightscout.github.io/",
      external: true,
    },
    {
      key: "mydiabby",
      href: "https://www.mydiabby.com/",
      external: true,
    },
    {
      key: "github",
      href: "https://github.com/Maxime2i/nightscout-viewver",
      external: true,
    },
  ];

  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <Image
                src="/logo.png"
                width={32}
                height={32}
                alt=""
                className="h-8 w-8 rounded-md"
              />
              <span className="text-base font-semibold tracking-tight text-slate-900">
                {t("Landing.brand")}
              </span>
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-600">
              {t("Landing.footer.tagline")}
            </p>
            <p className="mt-4 max-w-md text-xs leading-relaxed text-slate-400">
              {t("Landing.footer.disclaimer")}
            </p>
          </div>

          <nav aria-label={t("Landing.footer.productTitle")}>
            <h3 className="text-sm font-semibold text-slate-900">
              {t("Landing.footer.productTitle")}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {productLinks.map((link) => (
                <li key={link.key}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-600 transition-colors hover:text-teal-700"
                  >
                    {t(`Landing.nav.${link.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={t("Landing.footer.resourcesTitle")}>
            <h3 className="text-sm font-semibold text-slate-900">
              {t("Landing.footer.resourcesTitle")}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {resourceLinks.map((link) => (
                <li key={link.key}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-slate-600 transition-colors hover:text-teal-700"
                  >
                    {t(`Landing.footer.${link.key}`)}
                    {link.external && (
                      <ExternalLink
                        className="h-3 w-3 opacity-60"
                        aria-hidden="true"
                      />
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 sm:flex-row">
          <p className="text-xs text-slate-500">
            © {year} {t("Landing.brand")} — {t("Landing.footer.rights")}
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/Maxime2i/nightscout-viewver"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 transition-colors hover:text-teal-700"
              aria-label="GitHub"
            >
              <Github className="h-4 w-4" aria-hidden="true" />
              GitHub
            </a>
            <p className="text-xs text-slate-400">
              {t("Landing.footer.madeWith")}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
