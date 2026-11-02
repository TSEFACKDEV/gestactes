/**
 * Liste des demandes du citoyen.
 * Propriétaire : JEUDIEU TSAGUE AUDREY DANIELLE
 * TODO :
 *  [ ] Ajouter la recherche plein texte.
 *  [ ] Tester la pagination.
 */

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { LuFileText, LuPlus } from "react-icons/lu";
import { Link } from "react-router-dom";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tabs } from "@/components/ui/Tabs";
import { fetchDemandes } from "@/features/citizen/api";
import { RequestCard } from "@/features/citizen/components/RequestCard";
import { getApiErrorMessage } from "@/lib/api";
import type { Statut } from "@/types";

const TABS = [
  { id: "all", label: "Toutes" },
  { id: "demandee", label: "Demandées" },
  { id: "en_instruction", label: "En instruction" },
  { id: "en_validation", label: "En validation" },
  { id: "signee", label: "Signées" },
  { id: "archivee", label: "Archivées" },
  { id: "rejetee", label: "Rejetées" },
];

export function CitizenRequestsPage() {
  const [page, setPage] = useState(1);
  const [statut, setStatut] = useState<Statut | "">("");

  const query = useQuery({
    queryKey: ["citizen", "demandes", page, statut],
    queryFn: () =>
      fetchDemandes({
        page,
        page_size: 12,
        statut: statut || undefined,
      }),
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Suivi"
        title="Mes demandes"
        description="Retrouvez toutes vos demandes et leur état d'avancement."
        actions={
          <Link to="/app/catalogue">
            <Button leftIcon={<LuPlus className="h-4 w-4" aria-hidden="true" />}>
              Nouvelle demande
            </Button>
          </Link>
        }
      />

      <Tabs
        items={TABS}
        value={statut || "all"}
        onChange={(value) => {
          setStatut(value === "all" ? "" : (value as Statut));
          setPage(1);
        }}
      />

      {query.isError ? (
        <Alert variant="danger" title="Impossible de charger les demandes">
          {getApiErrorMessage(query.error)}
        </Alert>
      ) : null}

      {query.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-36 w-full" />
        </div>
      ) : query.data?.items.length ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {query.data.items.map((demande) => (
              <RequestCard key={demande.id} demande={demande} />
            ))}
          </div>
          <Pagination
            page={query.data.page}
            pages={query.data.pages}
            onPageChange={setPage}
          />
        </>
      ) : (
        <EmptyState
          icon={LuFileText}
          title="Aucune demande dans cette catégorie"
          description={
            statut
              ? "Essayez un autre filtre ou déposez une nouvelle demande."
              : "Vous n'avez pas encore déposé de demande."
          }
          action={
            <Link to="/app/catalogue">
              <Button leftIcon={<LuPlus className="h-4 w-4" aria-hidden="true" />}>
                Déposer une demande
              </Button>
            </Link>
          }
        />
      )}
    </div>
  );
}
