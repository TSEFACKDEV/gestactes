/**
 * Modale de création/modification d'un type d'acte.
 * Propriétaire : NZEUTEM DOMOE EUNICE FELIXTINE
 * TODO :
 *  [ ] Remplacer le JSON brut par un éditeur de champs.
 *  [ ] Valider le schéma avant envoi.
 */

import { useEffect, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import type { FormField, TypeActe } from "@/types";
import { z } from "zod";

const formFieldSchema = z.object({
  name: z
    .string({ required_error: "Le nom du champ est obligatoire." })
    .max(80, "Le nom du champ ne peut pas dépasser 80 caractères.")
    .regex(
      /^[a-z][a-z0-9_]*$/,
      "Le nom doit commencer par une minuscule et ne contenir que des minuscules, chiffres et _ .",
    ),
  label: z
    .string({ required_error: "Le libellé du champ est obligatoire." })
    .trim()
    .min(1, "Le libellé du champ est obligatoire.")
    .max(150, "Le libellé ne peut pas dépasser 150 caractères."),
  type: z.enum(["text", "textarea", "date", "number", "select", "checkbox", "file"], {
    required_error: "Le type de champ est invalide.",
  }),
  required: z.boolean().default(true),
  placeholder: z.string().max(200).nullable().optional(),
  help: z.string().max(300).nullable().optional(),
  options: z
    .array(
      z.object({
        value: z.string().trim().min(1, "La valeur d'une option est obligatoire."),
        label: z.string().trim().min(1, "Le libellé d'une option est obligatoire."),
      }),
    )
    .nullable()
    .optional(),
});

const formFieldArraySchema = z.array(formFieldSchema).superRefine((fields, context) => {
  const names = new Set<string>();
  fields.forEach((field, index) => {
    if (names.has(field.name)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ce nom de champ est déjà utilisé.",
        path: [index, "name"],
      });
    }
    names.add(field.name);

    if (field.type === "select" && !field.options?.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Un champ de type liste doit avoir au moins une option.",
        path: [index, "options"],
      });
    }
  });
});

export interface TypeFormValues {
  code: string;
  label: string;
  description: string;
  form_schema: FormField[];
  template_md: string;
}

export function TypeFormModal({
  open,
  onClose,
  type,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  type?: TypeActe | null;
  onSubmit: (values: TypeFormValues) => void;
  isPending: boolean;
}) {
  const editing = Boolean(type);
  const [values, setValues] = useState<TypeFormValues>({
    code: "",
    label: "",
    description: "",
    form_schema: [],
    template_md: "",
  });
  const [schemaText, setSchemaText] = useState("[]");
  const [error, setError] = useState<string | null>(null);
  let previewFields: FormField[] = [];

  try {
    const result = formFieldArraySchema.safeParse(JSON.parse(schemaText));
    if (result.success) previewFields = result.data;
  } catch {
    previewFields = [];
  }

  useEffect(() => {
    if (!open) return;
    setValues({
      code: type?.code ?? "",
      label: type?.label ?? "",
      description: type?.description ?? "",
      form_schema: type?.form_schema ?? [],
      template_md: type?.template_md ?? "",
    });
    setSchemaText(JSON.stringify(type?.form_schema ?? [], null, 2));
    setError(null);
  }, [open, type]);

  function submit() {
    try {
      const result = formFieldArraySchema.safeParse(JSON.parse(schemaText));
      if (!result.success) {
        const [issue] = result.error.issues;
        const fieldIndex = issue.path[0];
        const fieldLabel =
          typeof fieldIndex === "number" ? `Champ ${fieldIndex + 1} : ` : "";
        setError(`${fieldLabel}${issue.message}`);
        return;
      }
      setError(null);
      onSubmit({
        code: values.code.trim(),
        label: values.label.trim(),
        description: values.description.trim(),
        form_schema: result.data,
        template_md: values.template_md,
      });
    } catch {
      setError("Le schéma n'est pas un JSON valide.");
    }
  }

  const canSubmit =
    values.label.trim().length > 1 &&
    (editing || /^[a-z0-9-]+$/.test(values.code.trim()));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Modifier le type d'acte" : "Créer un type d'acte"}
      description="Le schéma décrit les champs du formulaire citoyen."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button isLoading={isPending} disabled={!canSubmit} onClick={submit}>
            {editing ? "Enregistrer" : "Créer le type"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error ? <Alert variant="danger">{error}</Alert> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Code"
            value={values.code}
            onChange={(event) =>
              setValues((current) => ({ ...current, code: event.target.value }))
            }
            disabled={editing}
            placeholder="attestation-residence"
            hint="Minuscules, chiffres et tirets."
            required
          />
          <Input
            label="Libellé"
            value={values.label}
            onChange={(event) =>
              setValues((current) => ({ ...current, label: event.target.value }))
            }
            placeholder="Attestation de résidence"
            required
          />
        </div>
        <Textarea
          label="Description"
          value={values.description}
          onChange={(event) =>
            setValues((current) => ({ ...current, description: event.target.value }))
          }
          rows={2}
        />
        <Textarea
          label="Schéma du formulaire (JSON)"
          value={schemaText}
          onChange={(event) => setSchemaText(event.target.value)}
          rows={10}
          className="font-mono text-xs"
          hint='Tableau de champs : [{"name":"adresse","label":"Adresse","type":"text","required":true}]'
        />
        <section
          aria-label="Aperçu du formulaire"
          className="space-y-3 rounded-md border border-line p-4"
        >
          <h3 className="text-sm font-semibold text-ink">Aperçu du formulaire</h3>
          {previewFields.length ? (
            previewFields.map((field) => (
              <div key={field.name} className="space-y-1.5">
                <label
                  htmlFor={`preview-${field.name}`}
                  className="block text-[13px] font-medium text-ink"
                >
                  {field.label}
                  {field.required ? <span className="ml-1 text-danger">*</span> : null}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    id={`preview-${field.name}`}
                    aria-label={field.label}
                    placeholder={field.placeholder ?? ""}
                    rows={2}
                    disabled
                    className="min-h-16 w-full rounded-md border border-line bg-surface-muted px-3 py-2.5 text-sm text-ink-soft"
                  />
                ) : field.type === "select" ? (
                  <select
                    id={`preview-${field.name}`}
                    aria-label={field.label}
                    disabled
                    className="h-10 w-full rounded-md border border-line bg-surface-muted px-3 text-sm text-ink-soft"
                  >
                    <option value="">Sélectionner</option>
                    {(field.options ?? []).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === "checkbox" ? (
                  <input
                    id={`preview-${field.name}`}
                    aria-label={field.label}
                    type="checkbox"
                    disabled
                    className="h-4 w-4 rounded border-line text-primary"
                  />
                ) : (
                  <input
                    id={`preview-${field.name}`}
                    aria-label={field.label}
                    type={
                      field.type === "date" || field.type === "number"
                        ? field.type
                        : field.type === "file"
                          ? "file"
                          : "text"
                    }
                    placeholder={field.placeholder ?? ""}
                    disabled
                    className="h-10 w-full rounded-md border border-line bg-surface-muted px-3 text-sm text-ink-soft"
                  />
                )}
                {field.help ? (
                  <p className="text-xs text-ink-soft">{field.help}</p>
                ) : null}
              </div>
            ))
          ) : (
            <p className="text-sm text-ink-soft">Aucun champ valide à prévisualiser.</p>
          )}
        </section>
        <Textarea
          label="Gabarit Markdown"
          value={values.template_md}
          onChange={(event) =>
            setValues((current) => ({ ...current, template_md: event.target.value }))
          }
          rows={8}
          className="font-mono text-xs"
          hint="Utilisez {{ numero }}, {{ demandeur.nom }}, {{ donnees.adresse }}."
        />
      </div>
    </Modal>
  );
}
