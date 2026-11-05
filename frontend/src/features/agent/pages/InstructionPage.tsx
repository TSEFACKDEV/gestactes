/**
 * Page d'instruction d'une demande.
 * Propriétaire : LEUKAM TCHEUMALEU MAXIME
 * TODO :
 *  [ ] Afficher l'aperçu de l'acte rendu.
 *  [ ] Tester les actions complément/soumission.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LuArrowLeft, LuInbox, LuPlay } from "react-icons/lu";
import { Link, useParams } from "react-router-dom";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Timeline, type TimelineItem } from "@/components/ui/Timeline";
import { useToast } from "@/context/ToastContext";
import { InstructionEditor } from "@/features/agent/components/InstructionEditor";
import {
  fetchDemande,
  fetchHistorique,
  takeCharge,
} from "@/features/agent/api";
import { getApiErrorMessage } from "@/lib/api";
import { formatDateTime, fullName } from "@/lib/format";
import { actionLabel, eventDescription } from "@/lib/demande";

export function AgentInstructionPage() {
  const { id: idParam } = useParams();
  const id = Number(idParam);
  const toast = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["agent", "demande", id],
    queryFn: () => fetchDemande(id),
    enabled: Number.isFinite(id),
  });

  const history = useQuery({
    queryKey: ["agent", "historique", id],
    queryFn: () => fetchHistorique(id),
    enabled: Number.isFinite(id),
  });

  const takeChargeMutation = useMutation({
    mutationFn: () => takeCharge(id),
    onSuccess: (demande) => {
      queryClient.setQueryData(["agent", "demande", id], demande);
      queryClient.invalidateQueries({ queryKey: ["agent", "queue"] });
      toast.success("Demande prise en charge");
    },
    onError: (error) =>
      toast.error("Prise en charge impossible", getApiErrorMessage(error)),
  });

  if (!Number.isFinite(id)) {
    return <Alert variant="danger">Identifiant de demande invalide.</Alert>;
  }

  if (query.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <Alert variant="danger" title="Demande introuvable">
        {getApiErrorMessage(query.error)}
      </Alert>
    );
  }

  if (!query.data) return null;
  const demande = query.data;

  const timeline: TimelineItem[] = (history.data ?? []).map((item, index) => ({
    id: `${item.type}-${item.sha ?? index}`,
    title: actionLabel(item.action),
    description: eventDescription(item.actor, item.message),
    date: formatDateTime(item.created_at),
    status: index === (history.data?.length ?? 0) - 1 ? "current" : "done",
  }));

  return (
    <div className="space-y-8">
      <Link
        to="/app/agent/file"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition hover:text-ink"
      >
        <LuArrowLeft className="h-4 w-4" aria-hidden="true" />
        Retour à la file
      </Link>

      <PageHeader
        eyebrow={demande.numero}
        title={demande.type.label}
        description={`Demandeur : ${fullName(demande.demandeur)} — déposée le ${formatDateTime(demande.created_at)}.`}
        actions={<StatusBadge statut={demande.statut} />}
      />

      {demande.statut === "demandee" ? (
        <Card>
          <CardHeader
            title="Demande non prise en charge"
            description="Prenez en charge la demande pour créer la branche de travail et commencer la rédaction."
          />
          <CardBody className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl text-sm leading-relaxed text-ink-soft">
              La prise en charge assigne le dossier à votre compte et initialise
              le brouillon dans GitHub.
            </p>
            <Button
              leftIcon={<LuPlay className="h-4 w-4" aria-hidden="true" />}
              isLoading={takeChargeMutation.isPending}
              onClick={() => takeChargeMutation.mutate()}
            >
              Prendre en charge
            </Button>
          </CardBody>
        </Card>
      ) : demande.statut === "en_instruction" ? (
        <InstructionEditor demande={demande} />
      ) : (
        <Alert variant="info" title="Dossier en lecture seule">
          Ce dossier est au statut « {demande.statut} ». Vous pouvez consulter son
          contenu et son historique, mais plus le modifier.
        </Alert>
      )}

      {demande.statut !== "en_instruction" && demande.acte_md ? (
        <Card>
          <CardHeader title="Contenu de l'acte" />
          <CardBody>
            <pre className="whitespace-pre-wrap rounded-md bg-surface-muted p-4 font-mono text-xs leading-relaxed text-ink-soft">
              {demande.acte_md}
            </pre>
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader
          title="Historique du dossier"
          action={<LuInbox className="h-5 w-5 text-ink-soft" aria-hidden="true" />}
        />
        <CardBody>
          {history.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : timeline.length ? (
            <Timeline items={timeline} />
          ) : (
            <EmptyState
              icon={LuInbox}
              title="Aucun événement"
              description="L'historique apparaîtra après la première action."
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
