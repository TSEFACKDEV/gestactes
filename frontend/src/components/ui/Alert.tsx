/**
 * Alerte inline.
 * Propriétaire : GUEMOGNE GERALDINE ESTHER
 * TODO : ajouter un test de rendu et vérifier l'accessibilité.
 */

import type { ReactNode } from "react";
import {
  LuCircleAlert,
  LuCircleCheck,
  LuInfo,
  LuTriangleAlert,
} from "react-icons/lu";

import { cn } from "@/lib/utils";

type Variant = "info" | "success" | "warning" | "danger";

const VARIANTS: Record<Variant, { container: string; icon: typeof LuInfo }> = {
  info: { container: "border-info/20 bg-info-soft text-info", icon: LuInfo },
  success: {
    container: "border-success/20 bg-success-soft text-success",
    icon: LuCircleCheck,
  },
  warning: {
    container: "border-warning/20 bg-warning-soft text-warning",
    icon: LuTriangleAlert,
  },
  danger: {
    container: "border-danger/20 bg-danger-soft text-danger",
    icon: LuCircleAlert,
  },
};

export interface AlertProps {
  variant?: Variant;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Alert({ variant = "info", title, children, className }: AlertProps) {
  const { container, icon: Icon } = VARIANTS[variant];
  return (
    <div
      role="alert"
      className={cn("flex items-start gap-3 rounded-lg border p-4", container, className)}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 text-sm leading-relaxed">
        {title ? <p className="font-medium text-ink">{title}</p> : null}
        <div className={cn(title && "mt-1", "text-ink-soft")}>{children}</div>
      </div>
    </div>
  );
}
