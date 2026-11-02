/**
 * Timeline verticale.
 * Propriétaire : GUEMOGNE GERALDINE ESTHER
 * TODO : ajouter un test de rendu et vérifier l'accessibilité.
 */

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface TimelineItem {
  id: string | number;
  title: string;
  description?: string;
  date?: string;
  status?: "done" | "current" | "upcoming";
  icon?: ReactNode;
}

const DOT_STYLES = {
  done: "bg-success border-success",
  current: "bg-primary border-primary",
  upcoming: "bg-surface border-line",
};

export function Timeline({ items }: { items: TimelineItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-ink-soft">Aucun événement pour le moment.</p>;
  }

  return (
    <ol className="relative space-y-6 border-l border-line pl-6">
      {items.map((item) => {
        const status = item.status ?? "upcoming";
        return (
          <li key={item.id} className="relative">
            <span
              className={cn(
                "absolute -left-[31px] top-1 flex h-3 w-3 items-center justify-center rounded-full border-2",
                DOT_STYLES[status],
              )}
              aria-hidden="true"
            />
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
              <p className="text-sm font-medium text-ink">{item.title}</p>
              {item.date ? (
                <time className="text-xs text-ink-soft">{item.date}</time>
              ) : null}
            </div>
            {item.description ? (
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                {item.description}
              </p>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
