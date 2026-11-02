/**
 * Zone de texte.
 * Propriétaire : GUEMOGNE GERALDINE ESTHER
 * TODO : ajouter un test de rendu et vérifier l'accessibilité.
 */

import {
  forwardRef,
  useId,
  type TextareaHTMLAttributes,
} from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, required, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    const describedBy = [error ? `${textareaId}-error` : null, hint ? `${textareaId}-hint` : null]
      .filter(Boolean)
      .join(" ");

    return (
      <div className="space-y-1.5">
        {label ? (
          <label
            htmlFor={textareaId}
            className="block text-[13px] font-medium text-ink"
          >
            {label}
            {required ? <span className="ml-1 text-danger">*</span> : null}
          </label>
        ) : null}
        <textarea
          ref={ref}
          id={textareaId}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy || undefined}
          className={cn(
            "min-h-28 w-full rounded-md border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft/60 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-surface-muted",
            error && "border-danger focus:border-danger focus:ring-danger/20",
            className,
          )}
          {...props}
        />
        {hint && !error ? (
          <p id={`${textareaId}-hint`} className="text-xs text-ink-soft">
            {hint}
          </p>
        ) : null}
        {error ? (
          <p id={`${textareaId}-error`} className="text-xs text-danger">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
