/**
 * Dépôt d'une nouvelle demande.
 * Propriétaire : JEUDIEU TSAGUE AUDREY DANIELLE
 *
 * - Le type d'acte est porté par l'URL (`?type=<code>`), donc robuste au
 *   rechargement.
 * - Validation Zod générée depuis le `form_schema` (voir `DynamicForm`).
 * - Brouillon : les valeurs saisies (pas les pièces, qu'un navigateur ne peut
 *   pas conserver) sont enregistrées dans le `localStorage` de cet appareil,
 *   par utilisateur et par type d'acte, pendant 7 jours.
 * - Envoi `multipart/form-data` avec clé d'idempotence : un second clic ou un
 *   nouvel essai après coupure réseau ne crée pas de doublon.
 */

import { useQuery } from "@tanstack/react-query";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  LuArrowLeft,
  LuArrowRight,
  LuFileText,
  LuListChecks,
  LuRefreshCw,
  LuShieldCheck,
} from "react-icons/lu";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  createDemande,
  createIdempotencyKey,
  fetchTypes,
  interpretCreateError,
} from "@/features/citizen/api";
import {
  DynamicForm,
  fieldDomId,
  isRenderableField,
  validateForm,
} from "@/features/citizen/components/DynamicForm";
import {
  PieceUploader,
  validatePieces,
} from "@/features/citizen/components/PieceUploader";
import { getApiErrorMessage } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type { FormField } from "@/types";

/* ------------------------------------------------------------------ */
/* Brouillon local                                                     */
/* ------------------------------------------------------------------ */

const DRAFT_PREFIX = "gestactes:draft:v1";
const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const DRAFT_DEBOUNCE_MS = 400;

interface StoredDraft {
  values: Record<string, unknown>;
  savedAt: string;
}

function draftKey(userId: number | undefined, typeCode: string): string {
  return `${DRAFT_PREFIX}:${userId ?? "anonyme"}:${typeCode}`;
}

function hasContent(values: Record<string, unknown>): boolean {
  return Object.values(values).some(
    (value) => value === true || (typeof value === "string" && value.trim() !== ""),
  );
}

/** Ne garde que les champs connus du schéma, avec le bon type de valeur. */
function sanitizeDraftValues(
  fields: FormField[],
  raw: unknown,
): Record<string, unknown> {
  const source = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const result: Record<string, unknown> = {};
  for (const field of fields.filter(isRenderableField)) {
    const value = source[field.name];
    if (field.type === "checkbox") {
      if (typeof value === "boolean") result[field.name] = value;
    } else if (typeof value === "string") {
      if (field.type === "select") {
        if ((field.options ?? []).some((option) => option.value === value)) {
          result[field.name] = value;
        }
      } else {
        result[field.name] = value;
      }
    }
  }
  return result;
}

function readDraft(key: string, fields: FormField[]): StoredDraft | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { values?: unknown; savedAt?: unknown };
    const savedAt = typeof parsed.savedAt === "string" ? parsed.savedAt : "";
    if (!savedAt || Date.now() - Date.parse(savedAt) > DRAFT_TTL_MS) {
      window.localStorage.removeItem(key);
      return null;
    }
    const values = sanitizeDraftValues(fields, parsed.values);
    return hasContent(values) ? { values, savedAt } : null;
  } catch {
    return null;
  }
}

function writeDraft(key: string, values: Record<string, unknown>): void {
  try {
    const draft: StoredDraft = { values, savedAt: new Date().toISOString() };
    window.localStorage.setItem(key, JSON.stringify(draft));
  } catch {
    // Stockage indisponible (navigation privée, quota) : le brouillon est facultatif.
  }
}

function clearDraft(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Rien à faire.
  }
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

interface FormProblem {
  title: string;
  messages: string[];
}

export function NewRequestPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const selectedCode = searchParams.get("type") ?? "";

  const [values, setValues] = useState<Record<string, unknown>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [serverFieldErrors, setServerFieldErrors] = useState<Record<string, string>>({});
  const [problem, setProblem] = useState<FormProblem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [draftLoadedFor, setDraftLoadedFor] = useState<string | null>(null);
  const [restoredAt, setRestoredAt] = useState<string | null>(null);
  // Cible du focus après une erreur : un champ invalide, sinon la synthèse.
  // Appliqué une fois les champs réactivés (ils sont désactivés pendant l'envoi).
  const [focusTarget, setFocusTarget] = useState<{ field: string | null } | null>(null);

  const problemRef = useRef<HTMLDivElement>(null);
  const submittingRef = useRef(false);
  const draftDisabledRef = useRef(false);
  const attemptRef = useRef<{ signature: string; key: string } | null>(null);

  const typesQuery = useQuery({
    queryKey: ["types-actes"],
    queryFn: fetchTypes,
  });

  const selectedType = useMemo(
    () => typesQuery.data?.find((type) => type.code === selectedCode) ?? null,
    [typesQuery.data, selectedCode],
  );

  const storageKey = selectedType ? draftKey(user?.id, selectedType.code) : null;

  /* Restauration du brouillon à l'ouverture d'un type d'acte. */
  useEffect(() => {
    if (!selectedType || !storageKey) {
      setDraftLoadedFor(null);
      return;
    }
    if (draftLoadedFor === selectedType.code) return;
    const draft = readDraft(storageKey, selectedType.form_schema);
    setValues(draft?.values ?? {});
    setRestoredAt(draft?.savedAt ?? null);
    setFiles([]);
    setSubmitted(false);
    setServerFieldErrors({});
    setProblem(null);
    draftDisabledRef.current = false;
    setDraftLoadedFor(selectedType.code);
  }, [selectedType, storageKey, draftLoadedFor]);

  /* Enregistrement automatique du brouillon (avec délai). */
  useEffect(() => {
    if (!selectedType || !storageKey || draftLoadedFor !== selectedType.code) return;
    const timer = window.setTimeout(() => {
      if (draftDisabledRef.current) return;
      if (hasContent(values)) writeDraft(storageKey, values);
      else clearDraft(storageKey);
    }, DRAFT_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [values, selectedType, storageKey, draftLoadedFor]);

  /* Le focus va au premier champ invalide, sinon à la synthèse d'erreurs. */
  useEffect(() => {
    if (!focusTarget || isSubmitting) return;
    const field = focusTarget.field ? document.getElementById(fieldDomId(focusTarget.field)) : null;
    (field ?? problemRef.current)?.focus();
    setFocusTarget(null);
  }, [focusTarget, isSubmitting, problem]);

  const clientErrors = useMemo(
    () =>
      submitted && selectedType ? validateForm(selectedType.form_schema, values).errors : {},
    [submitted, selectedType, values],
  );
  const fieldErrors = { ...serverFieldErrors, ...clientErrors };

  const handleChange = useCallback((name: string, value: unknown) => {
    setValues((current) => ({ ...current, [name]: value }));
    setServerFieldErrors((current) => {
      if (!(name in current)) return current;
      const { [name]: _removed, ...rest } = current;
      return rest;
    });
  }, []);

  function selectType(code: string) {
    setSearchParams({ type: code });
  }

  function resetSelection() {
    setSearchParams({});
  }

  function discardDraft() {
    if (storageKey) clearDraft(storageKey);
    setValues({});
    setFiles([]);
    setRestoredAt(null);
    setSubmitted(false);
    setServerFieldErrors({});
    setProblem(null);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!selectedType || submittingRef.current) return;

    setSubmitted(true);
    setProblem(null);

    const { data, errors } = validateForm(selectedType.form_schema, values);
    const piecesError = validatePieces(files);

    if (data === null || piecesError) {
      const messages: string[] = [];
      const invalidFields = selectedType.form_schema.filter(
        (field) => isRenderableField(field) && errors[field.name],
      );
      if (invalidFields.length > 0) {
        messages.push(
          `Champs à corriger : ${invalidFields.map((field) => field.label).join(", ")}.`,
        );
      }
      if (piecesError) messages.push(piecesError);
      setProblem({ title: "Le formulaire contient des erreurs", messages });
      setFocusTarget({ field: invalidFields[0]?.name ?? null });
      return;
    }

    // Même contenu = même clé ; contenu modifié = nouvelle demande légitime.
    const signature = JSON.stringify({
      type: selectedType.code,
      data,
      files: files.map((file) => [file.name, file.size, file.lastModified]),
    });
    if (attemptRef.current?.signature !== signature) {
      attemptRef.current = { signature, key: createIdempotencyKey() };
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    setProgress(files.length > 0 ? 0 : null);
    try {
      const demande = await createDemande(
        { type_code: selectedType.code, donnees: data },
        files,
        {
          idempotencyKey: attemptRef.current.key,
          onProgress: files.length > 0 ? setProgress : undefined,
        },
      );
      draftDisabledRef.current = true;
      if (storageKey) clearDraft(storageKey);
      toast.success("Demande déposée", `Le dossier ${demande.numero} est enregistré.`);
      navigate(`/app/demandes/${demande.id}`);
    } catch (err) {
      const failure = interpretCreateError(err);
      const known = new Set(selectedType.form_schema.filter(isRenderableField).map((f) => f.name));
      const mapped: Record<string, string> = {};
      const other: string[] = [];
      for (const [name, message] of Object.entries(failure.details)) {
        if (known.has(name)) mapped[name] = message;
        else other.push(`${name} : ${message}`);
      }
      setServerFieldErrors(mapped);
      setProblem({
        title:
          failure.status === 413
            ? "Pièce jointe trop volumineuse"
            : failure.status === 422
              ? "La demande n'a pas été acceptée"
              : "La demande n'a pas pu être déposée",
        messages: [failure.message, ...other],
      });
      const firstInvalid = selectedType.form_schema.find((field) => mapped[field.name]);
      setFocusTarget({ field: firstInvalid?.name ?? null });
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
      setProgress(null);
    }
  }

  if (typesQuery.isLoading) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Chargement du formulaire">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (typesQuery.isError) {
    return (
      <Alert variant="danger" title="Catalogue indisponible">
        <p>{getApiErrorMessage(typesQuery.error)}</p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-3"
          isLoading={typesQuery.isFetching}
          leftIcon={<LuRefreshCw className="h-4 w-4" aria-hidden="true" />}
          onClick={() => void typesQuery.refetch()}
        >
          Réessayer
        </Button>
      </Alert>
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

  if (!selectedType) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Nouvelle demande"
          title="Choisir un type d'acte"
          description="Le formulaire s'adapte au modèle défini par l'administration."
        />
        {selectedCode ? (
          <Alert variant="warning" title="Type d'acte introuvable">
            Le type « {selectedCode} » n'existe pas ou n'est plus disponible. Choisissez un type
            dans la liste ci-dessous.
          </Alert>
        ) : null}
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
              <Button
                className="mt-5 w-full"
                aria-label={`Continuer avec ${type.label}`}
                onClick={() => selectType(type.code)}
              >
                Continuer
              </Button>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const fields = selectedType.form_schema.filter(isRenderableField);
  const requiredCount = fields.filter((field) => field.required).length;

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
            disabled={isSubmitting}
          >
            Changer de type
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <form onSubmit={onSubmit} noValidate aria-label={`Demande : ${selectedType.label}`}>
            <CardHeader
              title="Informations du demandeur"
              description="Les champs marqués d'un astérisque sont obligatoires."
            />
            <CardBody className="space-y-6">
              {restoredAt ? (
                <Alert variant="info" title="Brouillon restauré">
                  <p>
                    Votre saisie du {formatDateTime(restoredAt)} a été retrouvée sur cet
                    appareil. Les pièces jointes ne sont pas conservées : ajoutez-les à nouveau.
                  </p>
                  <Button variant="secondary" size="sm" className="mt-3" onClick={discardDraft}>
                    Effacer le brouillon
                  </Button>
                </Alert>
              ) : null}

              {problem ? (
                <div ref={problemRef} tabIndex={-1} className="outline-none">
                  <Alert variant="danger" title={problem.title}>
                    {problem.messages.length === 1 ? (
                      <p>{problem.messages[0]}</p>
                    ) : (
                      <ul className="list-disc space-y-1 pl-4">
                        {problem.messages.map((message) => (
                          <li key={message}>{message}</li>
                        ))}
                      </ul>
                    )}
                  </Alert>
                </div>
              ) : null}

              <DynamicForm
                fields={selectedType.form_schema}
                values={values}
                errors={fieldErrors}
                disabled={isSubmitting}
                onChange={handleChange}
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
                    uploadProgress={progress}
                  />
                </div>
              </div>
            </CardBody>
            <CardFooter>
              <p className="mr-auto hidden text-xs text-ink-soft sm:block">
                Votre saisie est enregistrée sur cet appareil (hors pièces jointes).
              </p>
              <Link to="/app/catalogue">
                <Button variant="secondary" type="button" disabled={isSubmitting}>
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
                    {fields.length} dont {requiredCount} obligatoire{requiredCount > 1 ? "s" : ""}
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
