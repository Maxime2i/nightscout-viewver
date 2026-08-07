"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

interface LandingHeaderProps {
  locale: string;
}

const navLinks = [
  { key: "features", href: "#fonctionnalites" },
  { key: "how", href: "#comment-ca-marche" },
  { key: "forWhom", href: "#pour-qui" },
];

export function LandingHeader({ locale }: LandingHeaderProps) {
  const { t } = useTranslation("common");

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2.5"
          aria-label={t("Landing.nav.home")}
        >
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
        </Link>

        <nav
          aria-label={t("Landing.nav.label")}
          className="hidden items-center gap-8 md:flex"
        >
          {navLinks.map((link) => (
            <a
              key={link.key}
              href={link.href}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-teal-700"
            >
              {t(`Landing.nav.${link.key}`)}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div
            className="hidden items-center gap-1 sm:flex"
            role="group"
            aria-label="Langue"
          >
            {(["fr", "en"] as const).map((lang) => (
              <Link
                key={lang}
                href={`/${lang}`}
                aria-current={locale === lang ? "page" : undefined}
                className={`rounded-md px-2 py-1 text-xs font-semibold uppercase transition-colors ${
                  locale === lang
                    ? "bg-teal-700 text-white"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                }`}
              >
                {lang}
              </Link>
            ))}
          </div>
          <Button
            asChild
            size="sm"
            className="rounded-lg bg-teal-700 px-4 hover:bg-teal-600"
          >
            <Link href={`/${locale}/login`}>{t("Landing.nav.login")}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
