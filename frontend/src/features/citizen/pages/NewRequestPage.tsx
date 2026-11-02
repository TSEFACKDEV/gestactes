/**
 * Dépôt d'une nouvelle demande.
 * Propriétaire : JEUDIEU TSAGUE AUDREY DANIELLE
 * TODO :
 *  [ ] Validation Zod générée depuis le schéma.
 *  [ ] Brouillon local en cas de rechargement.
 *  [ ] Test du flux multipart.
 */

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, type FormEvent } from "react";
import {
  LuArrowLeft,
  LuArrowRight,
  LuFileText,
  LuListChecks,
  LuShieldCheck,
} from "react-icons/lu";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/context/ToastContext";
import { createDemande, fetchTypes } from "@/features/citizen/api";
import { DynamicForm } from "@/features/citizen/components/DynamicForm";
import { PieceUploader } from "@/features/citizen/components/PieceUploader";
import { getApiErrorMessage } from "@/lib/api";

export function NewRequestPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const initialType = searchParams.get("type") ?? "";
  const [selectedCode, setSelectedCode] = useState(initialType);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const typesQuery = useQuery({
    queryKey: ["types-actes"],
    queryFn: fetchTypes,
  });

  const selectedType = useMemo(
    () => typesQuery.data?.find((type) => type.code === selectedCode) ?? null,
    [typesQuery.data, selectedCode],
  );

  function resetSelection() {
    setSelectedCode("");
    setValues({});
    setFiles([]);
    setError(null);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!selectedType) return;

    const missing = selectedType.form_schema.filter((field) => {
      if (!field.required || field.type === "file") return false;
      const value = values[field.name];
      if (field.type === "checkbox") return value !== true;
      return value === undefined || value === null || String(value).trim() === "";
    });

    if (missing.length > 0) {
      setError(`Champs obligatoires manquants : ${missing.map((field) => field.label).join(", ")}.`);
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const demande = await createDemande(
        { type_code: selectedType.code, donnees: values },
        files,
      );
      toast.success("Demande déposée", `Le dossier ${demande.numero} est enregistré.`);
      navigate(`/app/demandes/${demande.id}`);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (typesQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!typesQuery.data?.length) {
    return (
      <EmptyState
        icon={LuFileText}
        title="Aucun type d'acte disponible"
        description="Le catalogue est vide pour le moment. Contactez un administrateur."
        action={
          <Link to="/app/catalogue">
            <Button variant="secondary">Retour au catalogue</Button>
          </Link>
        }
      />
    );
  }

  if (!selectedCode || !selectedType) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Nouvelle demande"
          title="Choisir un type d'acte"
          description="Le formulaire s'adapte au modèle défini par l'administration."
        />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {typesQuery.data.map((type) => (
            <Card key={type.id} className="flex h-full flex-col p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <LuFileText className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="mt-4 font-display text-lg font-semibold text-ink">
                {type.label}
              </h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">
                {type.description}
              </p>
              <Button className="mt-5 w-full" onClick={() => setSelectedCode(type.code)}>
                Continuer
              </Button>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Nouvelle demande"
        title={selectedType.label}
        description={selectedType.description}
        actions={
          <Button
            variant="secondary"
            leftIcon={<LuArrowLeft className="h-4 w-4" aria-hidden="true" />}
            onClick={resetSelection}
          >
            Changer de type
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <form onSubmit={onSubmit}>
            <CardHeader
              title="Informations du demandeur"
              description="Les champs marqués d'un astérisque sont obligatoires."
            />
            <CardBody className="space-y-6">
              {error ? <Alert variant="danger">{error}</Alert> : null}
              <DynamicForm
                fields={selectedType.form_schema}
                values={values}
                onChange={(name, value) =>
                  setValues((current) => ({ ...current, [name]: value }))
                }
              />
              <div>
                <h3 className="text-sm font-medium text-ink">Pièces justificatives</h3>
                <p className="mt-1 text-xs text-ink-soft">
                  Facultatif. Ajoutez les documents utiles à l'instruction.
                </p>
                <div className="mt-3">
                  <PieceUploader
                    files={files}
                    onChange={setFiles}
                    onError={(message) => setError(message)}
                  />
                </div>
              </div>
            </CardBody>
            <CardFooter>
              <Link to="/app/catalogue">
                <Button variant="secondary" type="button">
                  Annuler
                </Button>
              </Link>
              <Button
                type="submit"
                isLoading={isSubmitting}
                rightIcon={<LuArrowRight className="h-4 w-4" aria-hidden="true" />}
              >
                Déposer la demande
              </Button>
            </CardFooter>
          </form>
        </Card>

        <aside className="space-y-4">
          <Card>
            <CardBody>
              <h2 className="font-display text-base font-semibold text-ink">
                Récapitulatif
              </h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-soft">Type</dt>
                  <dd className="text-right font-medium text-ink">{selectedType.label}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-soft">Champs</dt>
                  <dd className="inline-flex items-center gap-1.5 font-medium text-ink">
                    <LuListChecks className="h-4 w-4" aria-hidden="true" />
                    {selectedType.form_schema.length}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-soft">Pièces</dt>
                  <dd className="font-medium text-ink">{files.length}</dd>
                </div>
              </dl>
            </CardBody>
          </Card>

          <Card className="border-primary/20 bg-primary-soft/50">
            <CardBody>
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface text-primary">
                <LuShieldCheck className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="mt-3 text-sm font-medium text-ink">Une trace vérifiable</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                Chaque étape de votre demande est horodatée. Vous pourrez suivre
                son avancement depuis votre espace.
              </p>
            </CardBody>
          </Card>
        </aside>
      </div>
    </div>
  );
}
