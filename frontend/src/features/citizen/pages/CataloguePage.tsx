/**
 * Catalogue des types d'actes.
 * Propriétaire : JEUDIEU TSAGUE AUDREY DANIELLE
 * TODO : brancher les données réelles et couvrir les états d'erreur.
 */

import { useQuery } from "@tanstack/react-query";
import { LuArrowRight, LuFileText, LuListChecks } from "react-icons/lu";
import { Link } from "react-router-dom";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { fetchTypes } from "@/features/citizen/api";
import { getApiErrorMessage } from "@/lib/api";

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
          {getApiErrorMessage(query.error)}
        </Alert>
      ) : null}

      {query.isLoading ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-52 w-full" />
          <Skeleton className="h-52 w-full" />
          <Skeleton className="h-52 w-full" />
        </div>
      ) : query.data?.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {query.data.map((type) => (
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
              <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-ink-soft">
                <LuListChecks className="h-4 w-4" aria-hidden="true" />
                {type.form_schema.length} champ(s) à renseigner
              </p>
              <Link to={`/app/demandes/nouvelle?type=${type.code}`} className="mt-5">
                <Button
                  className="w-full"
                  rightIcon={<LuArrowRight className="h-4 w-4" aria-hidden="true" />}
                >
                  Choisir ce type
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={LuFileText}
          title="Aucun type d'acte disponible"
          description="Un administrateur doit activer au moins un type d'acte."
        />
      )}
    </div>
  );
}
