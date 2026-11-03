/**
 * Formulaire dynamique généré depuis le `form_schema` du type d'acte.
 * Propriétaire : JEUDIEU TSAGUE AUDREY DANIELLE
 *
 * - `buildFormSchema` / `validateForm` génèrent la validation Zod à partir du
 *   schéma (text, textarea, date, number, select, checkbox).
 * - Les champs de type `file` ne sont pas rendus : les pièces passent par
 *   `PieceUploader`, hors du JSON `donnees`.
 * - Les valeurs saisies restent des chaînes (nombre inclus) ; la conversion
 *   se fait à la validation, ce qui évite de transformer un champ vide en 0.
 */

import { z } from "zod";

import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import type { FormField } from "@/types";

const REQUIRED = "Ce champ est obligatoire.";

/** Identifiant DOM d'un champ, utilisé pour placer le focus sur la première erreur. */
export function fieldDomId(name: string): string {
  return `field-${name}`;
}

export function isRenderableField(field: FormField): boolean {
  return field.type !== "file";
}

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function fieldSchema(field: FormField): z.ZodTypeAny {
  switch (field.type) {
    case "checkbox": {
      const base = z.boolean({ invalid_type_error: "Valeur invalide." }).default(false);
      return field.required
        ? base.refine((value) => value === true, "Vous devez cocher cette case.")
        : base;
    }

    case "number": {
      // Le champ vide donne `undefined` ; une saisie non numérique donne NaN.
      const toNumber = (value: unknown) => {
        if (typeof value === "string") {
          const trimmed = value.trim().replace(",", ".");
          return trimmed === "" ? undefined : Number(trimmed);
        }
        return value;
      };
      const number = z
        .number({ required_error: REQUIRED, invalid_type_error: "Saisissez un nombre valide." })
        .finite("Saisissez un nombre valide.");
      return z.preprocess(toNumber, field.required ? number : number.optional());
    }

    case "date": {
      const date = z
        .string({ required_error: REQUIRED })
        .trim()
        .refine(isValidIsoDate, "Saisissez une date valide.");
      return field.required
        ? z.string({ required_error: REQUIRED }).trim().min(1, REQUIRED).pipe(date)
        : z
            .string()
            .trim()
            .optional()
            .transform((value) => (value ? value : undefined))
            .pipe(date.optional());
    }

    case "select": {
      const allowed = (field.options ?? []).map((option) => option.value);
      const choice = z
        .string({ required_error: "Sélectionnez une option." })
        .refine((value) => allowed.includes(value), "Sélectionnez une option de la liste.");
      return field.required
        ? z.string({ required_error: "Sélectionnez une option." }).min(1, "Sélectionnez une option.").pipe(choice)
        : z
            .string()
            .optional()
            .transform((value) => (value ? value : undefined))
            .pipe(choice.optional());
    }

    // text, textarea
    default: {
      const text = z.string({ required_error: REQUIRED, invalid_type_error: "Valeur invalide." }).trim();
      return field.required
        ? text.min(1, REQUIRED)
        : text.optional().transform((value) => (value ? value : undefined));
    }
  }
}

/** Construit le schéma Zod correspondant à un `form_schema`. */
export function buildFormSchema(fields: FormField[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of fields) {
    if (isRenderableField(field)) shape[field.name] = fieldSchema(field);
  }
  return z.object(shape);
}

export interface FormValidation {
  /** Données prêtes pour `donnees` (nombres convertis, optionnels vides retirés). */
  data: Record<string, unknown> | null;
  /** Premier message d'erreur par nom de champ. */
  errors: Record<string, string>;
}

export function validateForm(
  fields: FormField[],
  values: Record<string, unknown>,
): FormValidation {
  const result = buildFormSchema(fields).safeParse(values);
  if (result.success) {
    const data = Object.fromEntries(
      Object.entries(result.data).filter(([, value]) => value !== undefined),
    );
    return { data, errors: {} };
  }
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const name = String(issue.path[0] ?? "");
    if (name && !(name in errors)) errors[name] = issue.message;
  }
  return { data: null, errors };
}

export function DynamicForm({
  fields,
  values,
  onChange,
  errors = {},
  disabled = false,
}: {
  fields: FormField[];
  values: Record<string, unknown>;
  onChange: (name: string, value: unknown) => void;
  /** Message d'erreur par nom de champ. */
  errors?: Record<string, string>;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-4">
      {fields.filter(isRenderableField).map((field) => {
        const value = values[field.name];
        const id = fieldDomId(field.name);
        const error = errors[field.name];

        if (field.type === "checkbox") {
          const hintId = `${id}-hint`;
          return (
            <div key={field.name} className="space-y-1">
              <Checkbox
                id={id}
                label={field.required ? `${field.label} (obligatoire)` : field.label}
                checked={value === true}
                disabled={disabled}
                aria-required={field.required}
                aria-invalid={Boolean(error)}
                aria-describedby={field.help ? hintId : undefined}
                error={error}
                onChange={(event) => onChange(field.name, event.target.checked)}
              />
              {field.help ? (
                <p id={hintId} className="pl-6 text-xs text-ink-soft">
                  {field.help}
                </p>
              ) : null}
            </div>
          );
        }

        if (field.type === "textarea") {
          return (
            <Textarea
              key={field.name}
              id={id}
              label={field.label}
              required={field.required}
              disabled={disabled}
              placeholder={field.placeholder ?? undefined}
              hint={field.help ?? undefined}
              error={error}
              value={String(value ?? "")}
              onChange={(event) => onChange(field.name, event.target.value)}
            />
          );
        }

        if (field.type === "select") {
          return (
            <Select
              key={field.name}
              id={id}
              label={field.label}
              required={field.required}
              disabled={disabled}
              hint={field.help ?? undefined}
              error={error}
              placeholder="Sélectionner"
              options={field.options ?? []}
              value={String(value ?? "")}
              onChange={(event) => onChange(field.name, event.target.value)}
            />
          );
        }

        return (
          <Input
            key={field.name}
            id={id}
            label={field.label}
            type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
            inputMode={field.type === "number" ? "decimal" : undefined}
            step={field.type === "number" ? "any" : undefined}
            required={field.required}
            disabled={disabled}
            placeholder={field.placeholder ?? undefined}
            hint={field.help ?? undefined}
            error={error}
            value={String(value ?? "")}
            onChange={(event) => onChange(field.name, event.target.value)}
          />
        );
      })}
    </div>
  );
}
