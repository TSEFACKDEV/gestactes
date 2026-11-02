/**
 * Formulaire dynamique généré depuis le schéma du type d'acte.
 * Propriétaire : JEUDIEU TSAGUE AUDREY DANIELLE
 * TODO :
 *  [ ] Remplacer la validation manuelle par un schéma Zod généré.
 *  [ ] Tester tous les types de champs.
 */

import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import type { FormField } from "@/types";

export function DynamicForm({
  fields,
  values,
  onChange,
}: {
  fields: FormField[];
  values: Record<string, unknown>;
  onChange: (name: string, value: unknown) => void;
}) {
  return (
    <div className="space-y-4">
      {fields.map((field) => {
        const value = values[field.name];

        if (field.type === "checkbox") {
          return (
            <Checkbox
              key={field.name}
              label={field.label}
              checked={Boolean(value)}
              onChange={(event) => onChange(field.name, event.target.checked)}
            />
          );
        }

        if (field.type === "textarea") {
          return (
            <Textarea
              key={field.name}
              label={field.label}
              required={field.required}
              placeholder={field.placeholder ?? undefined}
              hint={field.help ?? undefined}
              value={String(value ?? "")}
              onChange={(event) => onChange(field.name, event.target.value)}
            />
          );
        }

        if (field.type === "select") {
          return (
            <Select
              key={field.name}
              label={field.label}
              required={field.required}
              hint={field.help ?? undefined}
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
            label={field.label}
            type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
            required={field.required}
            placeholder={field.placeholder ?? undefined}
            hint={field.help ?? undefined}
            value={String(value ?? "")}
            onChange={(event) =>
              onChange(
                field.name,
                field.type === "number" ? Number(event.target.value) : event.target.value,
              )
            }
          />
        );
      })}
    </div>
  );
}
