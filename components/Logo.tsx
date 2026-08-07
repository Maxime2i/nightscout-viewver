"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  /** Afficher le texte "DiabExplorer" à côté de l'icône (défaut: true) */
  showText?: boolean;
  textClassName?: string;
}

/**
 * Logo officiel DiabExplorer — SVG inline, scalable, palette teal/emerald.
 * Icône : courbe glycémique (ligne brisée ascendante) dans un carré arrondi
 * en dégradé teal → emerald, avec une pastille "lecture en direct" en bout de courbe.
 */
export function Logo({ className, showText = true, textClassName }: LogoProps) {
  const gradientId = useId();

  return (
    <span
      className={cn("inline-flex items-center gap-2.5", className)}
      role="img"
      aria-label="DiabExplorer"
    >
      <svg
        viewBox="0 0 40 40"
        className="h-8 w-8 shrink-0"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
        <rect
          x="1"
          y="1"
          width="38"
          height="38"
          rx="10"
          fill={`url(#${gradientId})`}
        />
        <path
          d="M8 27 L14 20 L18 24 L24 14 L28 18 L32 11"
          fill="none"
          stroke="white"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="32" cy="11" r="3.4" fill="white" />
      </svg>
      {showText && (
        <span
          className={cn(
            "text-base font-semibold tracking-tight text-slate-900",
            textClassName
          )}
        >
          DiabExplorer
        </span>
      )}
    </span>
  );
}
