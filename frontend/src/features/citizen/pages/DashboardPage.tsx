/**
 * Tableau de bord citoyen.
 * Propriétaire : JEUDIEU TSAGUE AUDREY DANIELLE
 * TODO :
 *  [ ] Remplacer le calcul local par des statistiques dédiées.
 *  [ ] Ajouter les actions rapides.
 */

import { useQuery } from "@tanstack/react-query";
import {
  LuArrowRight,
  LuCircleCheck,
  LuCircleX,
  LuClock,
  LuFileText,
  LuPlus,
} from "react-icons/lu";
import { Link } from "react-router-dom";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { RequestCard } from "@/features/citizen/components/RequestCard";
import { fetchDemandes } from "@/features/citizen/api";
import { getApiErrorMessage } from "@/lib/api";

const STAT_CARDS = [
  {
    key: "total",
    label: "Demandes déposées",
    icon: LuFileText,
    style: "bg-info-soft text-info",
  },
  {
    key: "enCours",
    label: "En cours de traitement",
    icon: LuClock,
    style: "bg-warning-soft text-warning",
  },
  {
    key: "signees",
    label: "Actes disponibles",
    icon: LuCircleCheck,
    style: "bg-success-soft text-success",
  },
  {
    key: "rejetees",
    label: "Demandes rejetées",
    icon: LuCircleX,
    style: "bg-danger-soft text-danger",
  },
] as const;

export function CitizenDashboardPage() {
  const query = useQuery({
    queryKey: ["citizen", "dashboard"],
    queryFn: () => fetchDemandes({ page: 1, page_size: 100 }),
  });

  const items = query.data?.items ?? [];
  const counts = {
    total: query.data?.total ?? 0,
    enCours: items.filter((item) =>
      ["en_instruction", "en_validation"].includes(item.statut),
    ).length,
    signees: items.filter((item) => ["signee", "archivee"].includes(item.statut)).length,
    rejetees: items.filter((item) => item.statut === "rejetee").length,
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Espace citoyen"
        title="Tableau de bord"
        description="Suivez l'avancement de vos demandes et retrouvez vos actes signés."
        actions={
          <Link to="/app/catalogue">
            <Button leftIcon={<LuPlus className="h-4 w-4" aria-hidden="true" />}>
              Nouvelle demande
            </Button>
          </Link>
        }
      />

      {query.isError ? (
        <Alert variant="danger" title="Impossible de charger vos demandes">
          {getApiErrorMessage(query.error)}
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STAT_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.key} className="p-5">
              <div className="flex items-center justify-between gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.style}`}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                {query.isLoading ? (
                  <Skeleton className="h-8 w-10" />
                ) : (
                  <span className="font-display text-2xl font-semibold text-ink">
                    {counts[card.key]}
                  </span>
                )}
              </div>
              <p className="mt-4 text-sm text-ink-soft">{card.label}</p>
            </Card>
          );
        })}
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">
              Demandes récentes
            </h2>
            <p className="text-sm text-ink-soft">Les cinq dernières demandes déposées.</p>
          </div>
          <Link
            to="/app/demandes"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Tout voir
            <LuArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {query.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={LuFileText}
            title="Aucune demande pour le moment"
            description="Choisissez un type d'acte dans le catalogue pour déposer votre première demande."
            action={
              <Link to="/app/catalogue">
                <Button leftIcon={<LuPlus className="h-4 w-4" aria-hidden="true" />}>
                  Déposer une demande
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.slice(0, 5).map((demande) => (
              <RequestCard key={demande.id} demande={demande} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
