/**
 * Détail d'une demande citoyenne.
 * Propriétaire : JEUDIEU TSAGUE AUDREY DANIELLE
 * TODO :
 *  [ ] Afficher un aperçu du PDF.
 *  [ ] Ajouter la réponse au complément.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  LuArrowLeft,
  LuDownload,
  LuExternalLink,
  LuFileText,
  LuHistory,
  LuPaperclip,
  LuShieldCheck,
  LuCircleX,
} from "react-icons/lu";
import { Link, useParams } from "react-router-dom";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/context/ToastContext";
import {
  cancelDemande,
  downloadPdf,
  fetchDemande,
  fetchHistorique,
} from "@/features/citizen/api";
import { RequestTimeline } from "@/features/citizen/components/RequestTimeline";
import { api, getApiErrorMessage } from "@/lib/api";
import {
  formatDate,
  formatDateTime,
  formatFileSize,
  fullName,
} from "@/lib/format";

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function RequestDetailPage() {
  const { id: idParam } = useParams();
  const id = Number(idParam);
  const toast = useToast();
  const queryClient = useQueryClient();
  const [cancelOpen, setCancelOpen] = useState(false);

  const query = useQuery({
    queryKey: ["demande", id],
    queryFn: () => fetchDemande(id),
    enabled: Number.isFinite(id),
  });

  const history = useQuery({
    queryKey: ["demande", id, "historique"],
    queryFn: () => fetchHistorique(id),
    enabled: Number.isFinite(id),
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelDemande(id),
    onSuccess: (demande) => {
      queryClient.setQueryData(["demande", id], demande);
      queryClient.invalidateQueries({ queryKey: ["citizen"] });
      setCancelOpen(false);
      toast.success("Demande annulée", "Le dossier est maintenant clôturé.");
    },
    onError: (error) =>
      toast.error("Annulation impossible", getApiErrorMessage(error)),
  });

  async function handleDownload() {
    try {
      const blob = await downloadPdf(id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `acte-${query.data?.numero ?? id}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Téléchargement impossible", getApiErrorMessage(error));
    }
  }

  async function handlePieceDownload(pieceId: number, filename: string) {
    try {
      const { data } = await api.get<Blob>(
        `/demandes/${id}/pieces/${pieceId}`,
        { responseType: "blob" },
      );
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Téléchargement impossible", getApiErrorMessage(error));
    }
  }

  if (!Number.isFinite(id)) {
    return <Alert variant="danger">Identifiant de demande invalide.</Alert>;
  }

  if (query.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
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
  const canDownload = ["signee", "archivee"].includes(demande.statut);
  const canCancel = demande.statut === "demandee";

  return (
    <div className="space-y-8">
      <Link
        to="/app/demandes"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition hover:text-ink"
      >
        <LuArrowLeft className="h-4 w-4" aria-hidden="true" />
        Retour à mes demandes
      </Link>

      <PageHeader
        eyebrow={demande.numero}
        title={demande.type.label}
        description={`Déposée le ${formatDate(demande.created_at)} — dernière mise à jour le ${formatDateTime(demande.updated_at)}.`}
        actions={
          <>
            {canCancel ? (
              <Button
                variant="secondary"
                leftIcon={<LuCircleX className="h-4 w-4" aria-hidden="true" />}
                onClick={() => setCancelOpen(true)}
              >
                Annuler
              </Button>
            ) : null}
            {canDownload ? (
              <Button
                leftIcon={<LuDownload className="h-4 w-4" aria-hidden="true" />}
                onClick={handleDownload}
              >
                Télécharger le PDF
              </Button>
            ) : null}
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge statut={demande.statut} />
        {demande.assigned_agent ? (
          <span className="text-sm text-ink-soft">
            Agent : {fullName(demande.assigned_agent)}
          </span>
        ) : null}
        {demande.pr_url ? (
          <a
            href={demande.pr_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Voir la Pull Request
            <LuExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        ) : null}
      </div>

      {demande.complement_attendu ? (
        <Alert variant="warning" title="Complément demandé">
          {demande.complement_message ??
            "L'agent a demandé une information complémentaire. Consultez la timeline pour plus de détails."}
        </Alert>
      ) : null}

      {demande.rejection_reason ? (
        <Alert variant="danger" title="Demande rejetée">
          {demande.rejection_reason}
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Informations du dossier"
              description="Données transmises lors du dépôt."
            />
            <CardBody>
              <dl className="grid gap-4 sm:grid-cols-2">
                {Object.entries(demande.donnees).map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-xs uppercase tracking-wide text-ink-soft">
                      {key.replaceAll("_", " ")}
                    </dt>
                    <dd className="mt-1 text-sm text-ink">{formatValue(value)}</dd>
                  </div>
                ))}
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Pièces justificatives"
              description={`${demande.pieces.length} pièce(s) jointe(s).`}
              action={<LuPaperclip className="h-5 w-5 text-ink-soft" aria-hidden="true" />}
            />
            <CardBody>
              {demande.pieces.length === 0 ? (
                <p className="text-sm text-ink-soft">Aucune pièce jointe.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {demande.pieces.map((piece) => (
                    <li
                      key={piece.id}
                      className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <LuFileText className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                        <div className="min-w-0">
                          <p className="truncate text-sm text-ink">{piece.filename}</p>
                          <p className="text-xs text-ink-soft">
                            {formatFileSize(piece.size_bytes)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<LuDownload className="h-4 w-4" aria-hidden="true" />}
                        onClick={() => handlePieceDownload(piece.id, piece.filename)}
                      >
                        Télécharger
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Historique"
              description="Actions et commits du dossier."
              action={<LuHistory className="h-5 w-5 text-ink-soft" aria-hidden="true" />}
            />
            <CardBody>
              {history.isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : history.isError ? (
                <p className="text-sm text-ink-soft">
                  L'historique n'est pas encore disponible.
                </p>
              ) : history.data?.length ? (
                <RequestTimeline items={history.data} />
              ) : (
                <EmptyState
                  icon={LuHistory}
                  title="Aucun événement"
                  description="Les actions apparaîtront au fur et à mesure."
                />
              )}
            </CardBody>
          </Card>

          {demande.signature ? (
            <Card>
              <CardHeader
                title="Signature"
                description="Empreinte de l'acte signé."
                action={<LuShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />}
              />
              <CardBody className="space-y-3 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink-soft">Signataire</p>
                  <p className="mt-1 text-ink">
                    {demande.signature.signataire.prenom}{" "}
                    {demande.signature.signataire.nom}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink-soft">Signé le</p>
                  <p className="mt-1 text-ink">{formatDateTime(demande.signed_at)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink-soft">SHA-256</p>
                  <p className="mt-1 break-all font-mono text-xs text-ink-soft">
                    {demande.signature.sha256_acte_json}
                  </p>
                </div>
              </CardBody>
            </Card>
          ) : null}
        </div>
      </div>

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Annuler cette demande ?"
        description="Cette action est définitive. La demande ne pourra plus être instruite."
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelOpen(false)}>
              Conserver
            </Button>
            <Button
              variant="danger"
              isLoading={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate()}
            >
              Annuler la demande
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-ink-soft">
          Le dossier {demande.numero} sera marqué comme annulé. Si vous avez
          besoin de ce document plus tard, vous devrez déposer une nouvelle
          demande.
        </p>
      </Modal>
    </div>
  );
}
