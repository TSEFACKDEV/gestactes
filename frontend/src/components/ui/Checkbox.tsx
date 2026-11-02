/**
 * Case à cocher.
 * Propriétaire : GUEMOGNE GERALDINE ESTHER
 * TODO : ajouter un test de rendu et vérifier l'accessibilité.
 */

import { forwardRef, useId, type InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const generatedId = useId();
    const checkboxId = id ?? generatedId;

    return (
      <div className="space-y-1">
        <div className="flex items-start gap-2.5">
          <input
            ref={ref}
            id={checkboxId}
            type="checkbox"
            className={cn(
              "mt-0.5 h-4 w-4 rounded border-line text-primary focus:ring-primary/30",
              className,
            )}
            {...props}
          />
          <label htmlFor={checkboxId} className="text-sm text-ink">
            {label}
          </label>
        </div>
        {error ? <p className="text-xs text-danger">{error}</p> : null}
      </div>
    );
  },
);

Checkbox.displayName = "Checkbox";
