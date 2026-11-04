/**
 * Tableau de bord citoyen.
 * Propriétaire : JEUDIEU TSAGUE AUDREY DANIELLE
 *
 * Les compteurs viennent des totaux renvoyés par `GET /demandes` (un appel
 * léger par statut, `page_size=1`) : ils restent exacts même au-delà de la
 * première page. Le contrat API ne définit pas d'endpoint de statistiques
 * citoyen (`/admin/statistiques` est réservé à l'admin).
 */

import { useQueries, useQuery } from "@tanstack/react-query";
import {
  LuArrowRight,
  LuCircleCheck,
  LuCircleX,
  LuClock,
  LuFileText,
  LuListChecks,
  LuPlus,
  LuRefreshCw,
  LuShieldCheck,
} from "react-icons/lu";
import { Link } from "react-router-dom";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { fetchDemandes } from "@/features/citizen/api";
import { RequestCard } from "@/features/citizen/components/RequestCard";
import { getApiErrorMessage } from "@/lib/api";
import type { Statut } from "@/types";

const RECENT_COUNT = 5;

/** Statuts comptés pour chaque carte (hors « total », qui n'a pas de filtre). */
const STAT_GROUPS = {
  enCours: ["demandee", "en_instruction", "en_validation", "validee"],
  signees: ["signee", "archivee"],
  rejetees: ["rejetee"],
} as const satisfies Record<string, readonly Statut[]>;

const COUNTED_STATUTS: Statut[] = Object.values(STAT_GROUPS).flat();

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

const QUICK_ACTIONS = [
  {
    to: "/app/catalogue",
    label: "Nouvelle demande",
    description: "Choisir un type d'acte et déposer un dossier.",
    icon: LuPlus,
  },
  {
    to: "/app/demandes",
    label: "Suivre mes demandes",
    description: "Consulter l'état et l'historique de vos dossiers.",
    icon: LuListChecks,
  },
  {
    to: "/verification",
    label: "Vérifier un acte",
    description: "Contrôler l'authenticité d'un acte par son numéro.",
    icon: LuShieldCheck,
  },
] as const;

export function CitizenDashboardPage() {
  const recentQuery = useQuery({
    queryKey: ["citizen", "dashboard", "recent"],
    queryFn: () => fetchDemandes({ page: 1, page_size: RECENT_COUNT }),
  });

  const countQueries = useQueries({
    queries: COUNTED_STATUTS.map((statut) => ({
      queryKey: ["citizen", "dashboard", "count", statut],
      queryFn: () => fetchDemandes({ statut, page: 1, page_size: 1 }),
    })),
  });

  const totals = new Map<Statut, number>();
  COUNTED_STATUTS.forEach((statut, index) => {
    totals.set(statut, countQueries[index]?.data?.total ?? 0);
  });
  const sumOf = (statuts: readonly Statut[]) =>
    statuts.reduce((acc, statut) => acc + (totals.get(statut) ?? 0), 0);

  const counts: Record<(typeof STAT_CARDS)[number]["key"], number> = {
    total: recentQuery.data?.total ?? 0,
    enCours: sumOf(STAT_GROUPS.enCours),
    signees: sumOf(STAT_GROUPS.signees),
    rejetees: sumOf(STAT_GROUPS.rejetees),
  };

  const groupState = (statuts: readonly Statut[]) => {
    const queries = statuts.map((statut) => countQueries[COUNTED_STATUTS.indexOf(statut)]);
    return {
      isLoading: queries.some((q) => q?.isLoading),
      isError: queries.some((q) => q?.isError),
    };
  };
  const cardState: Record<
    (typeof STAT_CARDS)[number]["key"],
    { isLoading: boolean; isError: boolean }
  > = {
    total: { isLoading: recentQuery.isLoading, isError: recentQuery.isError },
    enCours: groupState(STAT_GROUPS.enCours),
    signees: groupState(STAT_GROUPS.signees),
    rejetees: groupState(STAT_GROUPS.rejetees),
  };

  // Le contrat ne garantit pas l'ordre : on affiche les plus récentes d'abord.
  const recent = [...(recentQuery.data?.items ?? [])].sort(
    (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at),
  );

  const firstError = recentQuery.error ?? countQueries.find((q) => q.isError)?.error;
  const hasError = recentQuery.isError || countQueries.some((q) => q.isError);

  function retry() {
    void recentQuery.refetch();
    countQueries.forEach((q) => {
      if (q.isError) void q.refetch();
    });
  }

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

      {hasError ? (
        <Alert variant="danger" title="Impossible de charger vos demandes">
          <p>{getApiErrorMessage(firstError)}</p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-3"
            leftIcon={<LuRefreshCw className="h-4 w-4" aria-hidden="true" />}
            onClick={retry}
          >
            Réessayer
          </Button>
        </Alert>
      ) : null}

      <section aria-label="Statistiques de vos demandes">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {STAT_CARDS.map((card) => {
            const Icon = card.icon;
            const state = cardState[card.key];
            return (
              <Card key={card.key} className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.style}`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  {state.isLoading ? (
                    <Skeleton className="h-8 w-10" />
                  ) : (
                    <span
                      className="font-display text-2xl font-semibold text-ink"
                      data-testid={`stat-${card.key}`}
                    >
                      {state.isError ? "—" : counts[card.key]}
                    </span>
                  )}
                </div>
                <p className="mt-4 text-sm text-ink-soft">{card.label}</p>
              </Card>
            );
          })}
        </div>
      </section>

      <section aria-label="Actions rapides">
        <h2 className="mb-4 font-display text-lg font-semibold text-ink">
          Actions rapides
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.to} to={action.to} className="group block">
                <Card className="flex h-full items-start gap-4 p-5 transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-lifted">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{action.label}</p>
                    <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                      {action.description}
                    </p>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <section aria-label="Demandes récentes">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">
              Demandes récentes
            </h2>
            <p className="text-sm text-ink-soft">
              Vos {RECENT_COUNT} dernières demandes déposées.
            </p>
          </div>
          <Link
            to="/app/demandes"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Tout voir
            <LuArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {recentQuery.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
          </div>
        ) : recentQuery.isError ? null : recent.length === 0 ? (
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
            {recent.map((demande) => (
              <RequestCard key={demande.id} demande={demande} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
