/**
 * Indicateur de chargement.
 * Propriétaire : GUEMOGNE GERALDINE ESTHER
 * TODO : ajouter un test de rendu et vérifier l'accessibilité.
 */

import { LuLoaderCircle } from "react-icons/lu";

import { cn } from "@/lib/utils";

const SIZES = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

export function Spinner({
  size = "md",
  className,
  label = "Chargement",
}: {
  size?: keyof typeof SIZES;
  className?: string;
  label?: string;
}) {
  return (
    <span role="status" aria-label={label} className="inline-flex">
      <LuLoaderCircle
        className={cn("animate-spin text-primary", SIZES[size], className)}
        aria-hidden="true"
      />
    </span>
  );
}

export function FullPageSpinner({ label = "Chargement de l'application" }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas">
      <div className="flex flex-col items-center gap-3 text-sm text-ink-soft">
        <Spinner size="lg" label={label} />
        <p>{label}</p>
      </div>
    </div>
  );
}
