/**
 * Champ texte.
 * Propriétaire : GUEMOGNE GERALDINE ESTHER
 * TODO :
 *  [ ] Tester l'association label/erreur avec un lecteur d'écran.
 */

import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, id, required, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const describedBy = [error ? `${inputId}-error` : null, hint ? `${inputId}-hint` : null]
      .filter(Boolean)
      .join(" ");

    return (
      <div className="space-y-1.5">
        {label ? (
          <label
            htmlFor={inputId}
            className="block text-[13px] font-medium text-ink"
          >
            {label}
            {required ? <span className="ml-1 text-danger">*</span> : null}
          </label>
        ) : null}
        <div className="relative">
          {leftIcon ? (
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-soft">
              {leftIcon}
            </span>
          ) : null}
          <input
            ref={ref}
            id={inputId}
            required={required}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy || undefined}
            className={cn(
              "h-10 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink placeholder:text-ink-soft/60 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-surface-muted",
              leftIcon && "pl-10",
              error && "border-danger focus:border-danger focus:ring-danger/20",
              className,
            )}
            {...props}
          />
        </div>
        {hint && !error ? (
          <p id={`${inputId}-hint`} className="text-xs text-ink-soft">
            {hint}
          </p>
        ) : null}
        {error ? (
          <p id={`${inputId}-error`} className="text-xs text-danger">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = "Input";
