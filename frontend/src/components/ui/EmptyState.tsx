/**
 * État vide.
 * Propriétaire : GUEMOGNE GERALDINE ESTHER
 * TODO : ajouter un test de rendu et vérifier l'accessibilité.
 */

import type { ReactNode } from "react";
import type { IconType } from "react-icons";
import { LuInbox } from "react-icons/lu";

import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon = LuInbox,
  title,
  description,
  action,
  className,
}: {
  icon?: IconType;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-surface px-6 py-12 text-center",
        className,
      )}
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <h3 className="mt-4 font-display text-base font-semibold text-ink">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-sm leading-relaxed text-ink-soft">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
