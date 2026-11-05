/**
 * Tableau de bord administrateur.
 * Propriétaire : NZEUTEM DOMOE EUNICE FELIXTINE
 * TODO :
 *  [ ] Ajouter les filtres de période.
 *  [ ] Remplacer les barres CSS par un graphique accessible.
 */

import { useQuery } from "@tanstack/react-query";
import {
  LuArchive,
  LuChartBar,
  LuCircleCheck,
  LuClock,
  LuFileText,
} from "react-icons/lu";

import { Alert } from "@/components/ui/Alert";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { fetchStats } from "@/features/admin/api";
import { getApiErrorMessage } from "@/lib/api";
import type { Statut } from "@/types";

const TYPE_LABELS: Record<string, string> = {
  "attestation-residence": "Attestation de résidence",
  "extrait-naissance": "Extrait d'acte de naissance",
  "autorisation-batir": "Autorisation de bâtir",
};

export function AdminDashboardPage() {
  const query = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: fetchStats,
  });

  const stats = query.data;
  const statuses = Object.entries(stats?.par_statut ?? {}) as Array<[Statut, number]>;
  const maxStatus = Math.max(1, ...statuses.map(([, count]) => count));
  const types = Object.entries(stats?.par_type ?? {});
  const maxType = Math.max(1, ...types.map(([, count]) => count));

  const cards = [
    {
      label: "Demandes totales",
      value: stats?.total ?? 0,
      icon: LuFileText,
      style: "bg-info-soft text-info",
    },
    {
      label: "Actes archivés",
      value: stats?.par_statut.archivee ?? 0,
      icon: LuArchive,
      style: "bg-surface-muted text-ink-soft",
    },
    {
      label: "En validation",
      value: stats?.par_statut.en_validation ?? 0,
      icon: LuCircleCheck,
      style: "bg-primary-soft text-primary",
    },
    {
      label: "Délai moyen",
      value: `${stats?.delai_moyen_heures ?? 0} h`,
      icon: LuClock,
      style: "bg-warning-soft text-warning",
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Administration"
        title="Tableau de bord"
        description="Vue d'ensemble des demandes, des délais et de la répartition par type."
      />

      {query.isError ? (
        <Alert variant="danger" title="Statistiques indisponibles">
          {getApiErrorMessage(query.error)}
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="p-5">
              <div className="flex items-center justify-between gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.style}`}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                {query.isLoading ? (
                  <Skeleton className="h-8 w-14" />
                ) : (
                  <span className="font-display text-2xl font-semibold text-ink">
                    {card.value}
                  </span>
                )}
              </div>
              <p className="mt-4 text-sm text-ink-soft">{card.label}</p>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Répartition par statut"
            description="Nombre de demandes dans chaque état du workflow."
            action={<LuChartBar className="h-5 w-5 text-ink-soft" aria-hidden="true" />}
          />
          <CardBody className="space-y-4">
            {query.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              statuses.map(([statut, count]) => (
                <div key={statut}>
                  <div className="flex items-center justify-between gap-3">
                    <StatusBadge statut={statut} />
                    <span className="font-mono text-xs text-ink-soft">{count}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className="h-full rounded-full bg-primary/70"
                      style={{ width: `${(count / maxStatus) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Répartition par type"
            description="Volume de demandes par modèle d'acte."
          />
          <CardBody className="space-y-4">
            {query.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : types.length ? (
              types.map(([type, count]) => (
                <div key={type}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-ink">
                      {TYPE_LABELS[type] ?? type.replaceAll("-", " ")}
                    </span>
                    <span className="font-mono text-xs text-ink-soft">{count}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className="h-full rounded-full bg-accent/70"
                      style={{ width: `${(count / maxType) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-ink-soft">Aucune donnée par type.</p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
