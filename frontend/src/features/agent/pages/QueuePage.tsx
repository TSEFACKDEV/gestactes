/**
 * File d'instruction de l'agent.
 * Propriétaire : LEUKAM TCHEUMALEU MAXIME
 * TODO :
 *  [ ] Ajouter les filtres de date.
 *  [ ] Tester la prise en charge concurrente.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { LuArrowRight, LuInbox } from "react-icons/lu";
import { Link, useNavigate } from "react-router-dom";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { useToast } from "@/context/ToastContext";
import { QueueFilters } from "@/features/agent/components/QueueFilters";
import { fetchQueue, takeCharge } from "@/features/agent/api";
import { getApiErrorMessage } from "@/lib/api";
import { formatDate, fullName } from "@/lib/format";
import type { Statut } from "@/types";

export function AgentQueuePage() {
  const [q, setQ] = useState("");
  const [statut, setStatut] = useState("");
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["agent", "queue", q, statut, page],
    queryFn: () =>
      fetchQueue({
        q: q || undefined,
        statut: (statut || undefined) as Statut | undefined,
        page,
        page_size: 20,
      }),
  });

  const takeChargeMutation = useMutation({
    mutationFn: takeCharge,
    onSuccess: (demande) => {
      queryClient.invalidateQueries({ queryKey: ["agent", "queue"] });
      toast.success("Demande prise en charge", `Dossier ${demande.numero}.`);
      navigate(`/app/agent/demandes/${demande.id}`);
    },
    onError: (error) =>
      toast.error("Prise en charge impossible", getApiErrorMessage(error)),
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Espace agent"
        title="File d'instruction"
        description="Prenez en charge les demandes déposées et rédigez les actes."
      />

      <QueueFilters
        q={q}
        onQChange={(value) => {
          setQ(value);
          setPage(1);
        }}
        statut={statut}
        onStatutChange={(value) => {
          setStatut(value);
          setPage(1);
        }}
      />

      {query.isError ? (
        <Alert variant="danger" title="Impossible de charger la file">
          {getApiErrorMessage(query.error)}
        </Alert>
      ) : null}

      {query.isLoading ? (
        <Skeleton className="h-80 w-full" />
      ) : query.data?.items.length ? (
        <>
          <Table caption="Demandes à instruire">
            <THead>
              <TR>
                <TH>Dossier</TH>
                <TH>Type</TH>
                <TH>Demandeur</TH>
                <TH>Statut</TH>
                <TH>Déposée le</TH>
                <TH className="text-right">Action</TH>
              </TR>
            </THead>
            <TBody>
              {query.data.items.map((demande) => (
                <TR key={demande.id}>
                  <TD className="font-mono text-xs text-accent">{demande.numero}</TD>
                  <TD className="text-ink">{demande.type.label}</TD>
                  <TD className="text-ink-soft">{fullName(demande.demandeur)}</TD>
                  <TD>
                    <StatusBadge statut={demande.statut} />
                  </TD>
                  <TD className="text-ink-soft">{formatDate(demande.created_at)}</TD>
                  <TD className="text-right">
                    {demande.statut === "demandee" ? (
                      <Button
                        size="sm"
                        isLoading={
                          takeChargeMutation.isPending &&
                          takeChargeMutation.variables === demande.id
                        }
                        onClick={() => takeChargeMutation.mutate(demande.id)}
                      >
                        Prendre en charge
                      </Button>
                    ) : (
                      <Link to={`/app/agent/demandes/${demande.id}`}>
                        <Button
                          size="sm"
                          variant="secondary"
                          rightIcon={<LuArrowRight className="h-4 w-4" aria-hidden="true" />}
                        >
                          Ouvrir
                        </Button>
                      </Link>
                    )}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
          <Pagination
            page={query.data.page}
            pages={query.data.pages}
            onPageChange={setPage}
          />
        </>
      ) : (
        <EmptyState
          icon={LuInbox}
          title="Aucune demande dans la file"
          description="Les nouvelles demandes apparaîtront ici dès leur dépôt."
        />
      )}
    </div>
  );
}
