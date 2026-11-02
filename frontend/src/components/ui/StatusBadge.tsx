/**
 * Badge de statut d'une demande.
 * Propriétaire : GUEMOGNE GERALDINE ESTHER
 * TODO : ajouter un test de rendu et vérifier l'accessibilité.
 */

import { STATUT_DOTS, STATUT_LABELS, STATUT_STYLES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Statut } from "@/types";

export function StatusBadge({
  statut,
  className,
}: {
  statut: Statut;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        STATUT_STYLES[statut],
        className,
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", STATUT_DOTS[statut])}
        aria-hidden="true"
      />
      {STATUT_LABELS[statut]}
    </span>
  );
}
