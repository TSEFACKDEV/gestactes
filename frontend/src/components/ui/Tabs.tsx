/**
 * Onglets contrôlés.
 * Propriétaire : GUEMOGNE GERALDINE ESTHER
 * TODO : ajouter un test de rendu et vérifier l'accessibilité.
 */

import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

export function Tabs({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label="Filtres"
      className={cn("flex flex-wrap gap-1 border-b border-line", className)}
    >
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={cn(
              "relative -mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition",
              active
                ? "border-primary text-primary"
                : "border-transparent text-ink-soft hover:text-ink",
            )}
          >
            {item.label}
            {typeof item.count === "number" ? (
              <span className="rounded-full bg-surface-muted px-1.5 py-0.5 text-[11px] text-ink-soft">
                {item.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
