/**
 * Marque GestActes.
 * Propriétaire : GUEMOGNE GERALDINE ESTHER
 * TODO : tester le responsive et la navigation clavier.
 */

import { Link } from "react-router-dom";
import { LuFileCheck2 } from "react-icons/lu";

import { cn } from "@/lib/utils";

export function Brand({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link
      to="/"
      className={cn("inline-flex items-center gap-2.5", className)}
      aria-label="GestActes, accueil"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white shadow-sm">
        <LuFileCheck2 className="h-5 w-5" aria-hidden="true" />
      </span>
      {!compact ? (
        <span className="font-display text-lg font-semibold tracking-tight text-ink">
          GestActes
        </span>
      ) : null}
    </Link>
  );
}
