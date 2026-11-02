/**
 * Liste déroulante.
 * Propriétaire : GUEMOGNE GERALDINE ESTHER
 * TODO : ajouter un test de rendu et vérifier l'accessibilité.
 */

import {
  forwardRef,
  useId,
  type SelectHTMLAttributes,
} from "react";

import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { className, label, error, hint, options, placeholder, id, required, ...props },
    ref,
  ) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const describedBy = [error ? `${selectId}-error` : null, hint ? `${selectId}-hint` : null]
      .filter(Boolean)
      .join(" ");

    return (
      <div className="space-y-1.5">
        {label ? (
          <label
            htmlFor={selectId}
            className="block text-[13px] font-medium text-ink"
          >
            {label}
            {required ? <span className="ml-1 text-danger">*</span> : null}
          </label>
        ) : null}
        <select
          ref={ref}
          id={selectId}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy || undefined}
          className={cn(
            "h-10 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
            error && "border-danger focus:border-danger focus:ring-danger/20",
            className,
          )}
          {...props}
        >
          {placeholder ? <option value="">{placeholder}</option> : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {hint && !error ? (
          <p id={`${selectId}-hint`} className="text-xs text-ink-soft">
            {hint}
          </p>
        ) : null}
        {error ? (
          <p id={`${selectId}-error`} className="text-xs text-danger">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);

Select.displayName = "Select";
