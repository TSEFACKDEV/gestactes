/**
 * Badge générique.
 * Propriétaire : GUEMOGNE GERALDINE ESTHER
 * TODO : ajouter un test de rendu et vérifier l'accessibilité.
 */

import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type Variant = "neutral" | "primary" | "success" | "warning" | "danger" | "info";

const VARIANTS: Record<Variant, string> = {
  neutral: "bg-surface-muted text-ink-soft",
  primary: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
