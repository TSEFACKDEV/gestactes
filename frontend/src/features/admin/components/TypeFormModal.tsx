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
      const schema = JSON.parse(schemaText) as FormField[];
      if (!Array.isArray(schema)) {
        setError("Le schéma doit être un tableau JSON.");
        return;
      }
      setError(null);
      onSubmit({
        code: values.code.trim(),
        label: values.label.trim(),
        description: values.description.trim(),
        form_schema: schema,
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
