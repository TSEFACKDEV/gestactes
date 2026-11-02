/**
 * Squelette de chargement.
 * Propriétaire : GUEMOGNE GERALDINE ESTHER
 * TODO : ajouter un test de rendu et vérifier l'accessibilité.
 */

import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-shimmer rounded-md bg-[linear-gradient(90deg,#F1EFEA_0%,#E5E2DB_50%,#F1EFEA_100%)] bg-[length:600px_100%]",
        className,
      )}
    />
  );
}
