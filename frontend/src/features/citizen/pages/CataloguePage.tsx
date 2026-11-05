/**
 * Catalogue des types d'actes.
 * Propriétaire : JEUDIEU TSAGUE AUDREY DANIELLE
 *
 * Source : `GET /types-actes` (types actifs uniquement, cf. contrat API).
 */

import { useQuery } from "@tanstack/react-query";
import {
  LuArrowRight,
  LuFileText,
  LuListChecks,
  LuPaperclip,
  LuRefreshCw,
} from "react-icons/lu";
import { Link } from "react-router-dom";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { fetchTypes } from "@/features/citizen/api";
import { getApiErrorMessage } from "@/lib/api";
import { MAX_FILES, MAX_FILE_SIZE_MB } from "@/lib/constants";
import type { FormField, TypeActe } from "@/types";

/** Les champs de type `file` ne sont pas rendus dans le formulaire. */
function inputFields(type: TypeActe): FormField[] {
  return type.form_schema.filter((field) => field.type !== "file");
}

function TypeCard({ type }: { type: TypeActe }) {
  const fields = inputFields(type);
  const required = fields.filter((field) => field.required);

  return (
    <Card className="flex h-full flex-col p-6">
      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-soft text-primary">
        <LuFileText className="h-5 w-5" aria-hidden="true" />
      </span>
      <h2 className="mt-4 font-display text-lg font-semibold text-ink">{type.label}</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{type.description}</p>

      <div className="mt-4 flex-1 space-y-3 border-t border-line pt-4">
        <p className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
          <LuListChecks className="h-4 w-4 shrink-0" aria-hidden="true" />
          {fields.length} champ{fields.length > 1 ? "s" : ""} à renseigner
          {required.length > 0 ? ` dont ${required.length} obligatoire${required.length > 1 ? "s" : ""}` : ""}
        </p>
        {required.length > 0 ? (
          <ul className="space-y-1 text-xs text-ink-soft" aria-label="Informations obligatoires">
            {required.slice(0, 4).map((field) => (
              <li key={field.name} className="truncate">
                {field.label}
              </li>
            ))}
            {required.length > 4 ? <li>et {required.length - 4} autre(s)…</li> : null}
          </ul>
        ) : null}
        <p className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
          <LuPaperclip className="h-4 w-4 shrink-0" aria-hidden="true" />
          Pièces facultatives : {MAX_FILES} max., {MAX_FILE_SIZE_MB} Mo, PDF/JPEG/PNG
        </p>
      </div>

      <Link
        to={`/app/demandes/nouvelle?type=${encodeURIComponent(type.code)}`}
        aria-label={`Choisir ${type.label}`}
        className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-white shadow-sm transition duration-150 hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 active:scale-[0.98]"
      >
        Choisir ce type
        <LuArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </Card>
  );
}

export function CitizenCataloguePage() {
  const query = useQuery({
    queryKey: ["types-actes"],
    queryFn: fetchTypes,
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Catalogue"
        title="Demander un acte"
        description="Choisissez le type d'acte dont vous avez besoin. Le formulaire s'adapte automatiquement au modèle."
      />

      {query.isError ? (
        <Alert variant="danger" title="Catalogue indisponible">
          <p>{getApiErrorMessage(query.error)}</p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-3"
            isLoading={query.isFetching}
            leftIcon={<LuRefreshCw className="h-4 w-4" aria-hidden="true" />}
            onClick={() => void query.refetch()}
          >
            Réessayer
          </Button>
        </Alert>
      ) : query.isLoading ? (
        <div
          className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
          aria-busy="true"
          aria-label="Chargement du catalogue"
        >
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : query.data && query.data.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {query.data.map((type) => (
            <TypeCard key={type.id} type={type} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={LuFileText}
          title="Aucun type d'acte disponible"
          description="Aucun type d'acte n'est ouvert aux demandes pour le moment. Un administrateur doit en activer au moins un."
          action={
            <Link to="/app/tableau-de-bord">
              <Button variant="secondary">Retour au tableau de bord</Button>
            </Link>
          }
        />
      )}
    </div>
  );
}
