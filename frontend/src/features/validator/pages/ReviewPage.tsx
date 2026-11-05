/**
 * Page de revue et de signature.
 * Propriétaire : METAMMO TEUMA DANIELA CLEDYA
 * TODO :
 *  [ ] Brancher la comparaison sur les versions précédentes.
 *  [ ] Tester la signature et l'échec GitHub.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  LuArrowLeft,
  LuHistory,
  LuShieldCheck,
  LuSignature,
} from "react-icons/lu";
import { Link, useNavigate, useParams } from "react-router-dom";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Timeline, type TimelineItem } from "@/components/ui/Timeline";
import { useToast } from "@/context/ToastContext";
import {
  decide,
  fetchDemande,
  fetchDiff,
  fetchHistorique,
  sign,
} from "@/features/validator/api";
import { DecisionPanel } from "@/features/validator/components/DecisionPanel";
import { DiffViewer } from "@/features/validator/components/DiffViewer";
import { getApiErrorMessage } from "@/lib/api";
import { formatDateTime, fullName } from "@/lib/format";
import { actionLabel, eventDescription } from "@/lib/demande";
import type { DecisionType, SignatureResult } from "@/types";

export function ValidatorReviewPage() {
  const { id: idParam } = useParams();
  const id = Number(idParam);
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [signOpen, setSignOpen] = useState(false);
  const [signedResult, setSignedResult] = useState<SignatureResult | null>(null);

  const query = useQuery({
    queryKey: ["validator", "demande", id],
    queryFn: () => fetchDemande(id),
    enabled: Number.isFinite(id),
  });

  const history = useQuery({
    queryKey: ["validator", "historique", id],
    queryFn: () => fetchHistorique(id),
    enabled: Number.isFinite(id),
  });

  const diffQuery = useQuery({
    queryKey: ["validator", "diff", id],
    queryFn: () => fetchDiff(id),
    enabled: Number.isFinite(id),
  });

  const decisionMutation = useMutation({
    mutationFn: ({
      decision,
      comment,
    }: {
      decision: DecisionType;
      comment: string;
    }) => decide(id, decision, comment),
    onSuccess: (demande) => {
      queryClient.setQueryData(["validator", "demande", id], demande);
      queryClient.invalidateQueries({ queryKey: ["validator", "queue"] });
      if (demande.statut === "validee") {
        toast.success("Acte approuvé", "Vous pouvez maintenant le signer.");
      } else {
        toast.success("Décision enregistrée");
        navigate("/app/validation/file");
      }
    },
    onError: (error) =>
      toast.error("Décision impossible", getApiErrorMessage(error)),
  });

  const signMutation = useMutation({
    mutationFn: () => sign(id),
    onSuccess: (result) => {
      setSignedResult(result);
      setSignOpen(false);
      queryClient.setQueryData(["validator", "demande", id], result.demande);
      queryClient.invalidateQueries({ queryKey: ["validator", "queue"] });
      toast.success("Acte signé", "Le PDF et l'archive sont en cours de génération.");
    },
    onError: (error) =>
      toast.error("Signature impossible", getApiErrorMessage(error)),
  });

  if (!Number.isFinite(id)) {
    return <Alert variant="danger">Identifiant de demande invalide.</Alert>;
  }

  if (query.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-48 w-full" />
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
        to="/app/validation/file"
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

      {signedResult ? (
        <Alert variant="success" title="Signature enregistrée">
          Empreinte SHA-256 :{" "}
          <span className="break-all font-mono text-xs">
            {signedResult.signature.sha256_acte_json}
          </span>
          . Merge :{" "}
          <span className="font-mono text-xs">
            {signedResult.merge_commit_sha.slice(0, 12)}
          </span>
          .
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Contenu de l'acte"
              description="Version soumise à validation."
              action={<LuSignature className="h-5 w-5 text-ink-soft" aria-hidden="true" />}
            />
            <CardBody>
              <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap rounded-md bg-surface-muted p-4 font-mono text-xs leading-relaxed text-ink-soft">
                {demande.acte_md ?? "Aucun contenu rédigé."}
              </pre>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Données sources → acte rédigé"
              description="Comparaison entre les données du formulaire et le contenu rédigé."
            />
            <CardBody>
              <DiffViewer
                before={
                  diffQuery.data?.before ??
                  JSON.stringify(demande.donnees, null, 2)
                }
                after={diffQuery.data?.after ?? demande.acte_md ?? ""}
                emptyLabel="Aucune différence entre les données et le contenu rédigé."
              />
            </CardBody>
          </Card>

          {demande.statut === "en_validation" ? (
            <DecisionPanel
              isPending={decisionMutation.isPending}
              onSubmit={(decision, comment) =>
                decisionMutation.mutate({ decision, comment })
              }
            />
          ) : null}

          {demande.statut === "validee" ? (
            <Card>
              <CardHeader
                title="Signature de l'acte"
                description="La signature fusionne la Pull Request et déclenche l'archivage."
              />
              <CardBody className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-xl text-sm leading-relaxed text-ink-soft">
                  Vérifiez une dernière fois le contenu. La signature est
                  définitive et rend l'acte non modifiable.
                </p>
                <Button
                  leftIcon={<LuShieldCheck className="h-4 w-4" aria-hidden="true" />}
                  onClick={() => setSignOpen(true)}
                >
                  Signer l'acte
                </Button>
              </CardBody>
            </Card>
          ) : null}

          {signedResult ? (
            <Card>
              <CardHeader title="Détails de la signature" />
              <CardBody className="space-y-3 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink-soft">Signataire</p>
                  <p className="mt-1 text-ink">
                    {signedResult.signature.signataire.prenom}{" "}
                    {signedResult.signature.signataire.nom}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink-soft">Signé le</p>
                  <p className="mt-1 text-ink">
                    {formatDateTime(signedResult.signature.signe_le)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink-soft">
                    SHA-256 du contenu
                  </p>
                  <p className="mt-1 break-all font-mono text-xs text-ink-soft">
                    {signedResult.signature.sha256_acte_json}
                  </p>
                </div>
              </CardBody>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Historique"
              description="Commits et événements du dossier."
              action={<LuHistory className="h-5 w-5 text-ink-soft" aria-hidden="true" />}
            />
            <CardBody>
              {history.isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : timeline.length ? (
                <Timeline items={timeline} />
              ) : (
                <EmptyState
                  icon={LuHistory}
                  title="Aucun événement"
                  description="L'historique apparaîtra après la soumission."
                />
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Métadonnées" />
            <CardBody className="space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-ink-soft">Numéro</span>
                <span className="font-mono text-xs text-ink">{demande.numero}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-ink-soft">Agent</span>
                <span className="text-ink">{fullName(demande.assigned_agent)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-ink-soft">Pull Request</span>
                {demande.pr_url ? (
                  <a
                    href={demande.pr_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    Ouvrir
                  </a>
                ) : (
                  <span className="text-ink-soft">—</span>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal
        open={signOpen}
        onClose={() => setSignOpen(false)}
        title="Confirmer la signature"
        description="Cette action est définitive."
        footer={
          <>
            <Button variant="secondary" onClick={() => setSignOpen(false)}>
              Annuler
            </Button>
            <Button
              leftIcon={<LuShieldCheck className="h-4 w-4" aria-hidden="true" />}
              isLoading={signMutation.isPending}
              onClick={() => signMutation.mutate()}
            >
              Confirmer et signer
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-ink-soft">
          L'empreinte SHA-256 du contenu sera calculée, la Pull Request sera
          fusionnée et un PDF signé sera généré. L'acte ne pourra plus être
          modifié.
        </p>
      </Modal>
    </div>
  );
}
