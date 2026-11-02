/**
 * Avatar à initiales.
 * Propriétaire : GUEMOGNE GERALDINE ESTHER
 * TODO : ajouter un test de rendu et vérifier l'accessibilité.
 */

import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

export function Avatar({
  firstName,
  lastName,
  size = "md",
  className,
}: {
  firstName?: string;
  lastName?: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-primary-soft font-medium text-primary",
        SIZES[size],
        className,
      )}
      aria-hidden="true"
    >
      {initials(firstName, lastName)}
    </span>
  );
}
