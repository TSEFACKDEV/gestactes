/**
 * Détail d'une demande citoyenne.
 * Propriétaire : JEUDIEU TSAGUE AUDREY DANIELLE
 *
 * Conditions d'affichage (docs/repartition-taches.md) :
 *  - annulation : uniquement au statut `demandee` ;
 *  - PDF (téléchargement et aperçu) : uniquement aux statuts `signee`/`archivee`.
 *
 * Réponse à un complément : le contrat API ne fournit aucun endpoint permettant
 * au citoyen de répondre (`POST /demandes/{id}/complement` est réservé à
 * l'agent). La page affiche donc le message de l'agent sans simuler de
 * réponse ; voir le bilan de livraison pour la demande d'évolution.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import {
  LuArrowLeft,
  LuCircleX,
  LuDownload,
  LuEye,
  LuExternalLink,
  LuFileText,
  LuHistory,
  LuPaperclip,
  LuRefreshCw,
  LuShieldCheck,
} from "react-icons/lu";
import { Link, useParams } from "react-router-dom";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/context/ToastContext";
import {
  cancelDemande,
  downloadPdf,
  downloadPiece,
  fetchDemande,
  fetchHistorique,
  fetchTypes,
} from "@/features/citizen/api";
import { RequestTimeline } from "@/features/citizen/components/RequestTimeline";
import { getApiErrorMessage } from "@/lib/api";
import {
  formatDate,
  formatDateTime,
  formatFileSize,
  fullName,
} from "@/lib/format";
import type { FormField } from "@/types";

const CONTENT_TYPE_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "image/jpeg": "JPEG",
  "image/png": "PNG",
};

function readBlobText(blob: Blob): Promise<string> {
  if (typeof blob.text === "function") return blob.text();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

/** Message d'une erreur de requête `blob` : le corps JSON arrive sous forme de Blob. */
async function getBlobErrorMessage(error: unknown): Promise<string> {
  if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
    try {
      const body = JSON.parse(await readBlobText(error.response.data)) as {
        error?: { message?: string };
        detail?: string;
      };
      const message = body.error?.message ?? body.detail;
      if (message) return message;
    } catch {
      // Corps non JSON : message générique ci-dessous.
    }
    return error.response.status === 404
      ? "Le fichier demandé n'est pas disponible."
      : "Une erreur est survenue. Réessayez dans un instant.";
  }
  return getApiErrorMessage(error);
}

/** Enregistre un Blob sous le nom donné. */
function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Révocation différée : certains navigateurs lisent l'URL après le clic.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function humanizeKey(key: string): string {
  const spaced = key.replace(/[_-]+/g, " ").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function formatValue(value: unknown, field?: FormField): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Oui" : "Non";
  if (field?.type === "select") {
    return field.options?.find((option) => option.value === value)?.label ?? String(value);
  }
  if (field?.type === "date" && typeof value === "string") return formatDate(value);
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function RequestDetailPage() {
  const { id: idParam } = useParams();
  const id = Number(idParam);
  const validId = Number.isInteger(id) && id > 0;
  const toast = useToast();
  const queryClient = useQueryClient();

  const [cancelOpen, setCancelOpen] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pieceBusy, setPieceBusy] = useState<number | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const query = useQuery({
    queryKey: ["demande", id],
    queryFn: () => fetchDemande(id),
    enabled: validId,
  });

  const history = useQuery({
    queryKey: ["demande", id, "historique"],
    queryFn: () => fetchHistorique(id),
    enabled: validId,
  });

  // Libellés et ordre des champs : non bloquant, repli sur les clés brutes.
  const types = useQuery({
    queryKey: ["types-actes"],
    queryFn: fetchTypes,
    enabled: validId && Boolean(query.data),
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelDemande(id),
    onSuccess: (demande) => {
      queryClient.setQueryData(["demande", id], demande);
      void queryClient.invalidateQueries({ queryKey: ["citizen"] });
      void queryClient.invalidateQueries({ queryKey: ["demande", id, "historique"] });
      setCancelOpen(false);
      toast.success("Demande annulée", "Le dossier est maintenant clôturé.");
    },
    onError: (error) => {
      // Ex. 409 : l'agent a pris la demande en charge entre-temps. On
      // rafraîchit pour que le statut et les boutons reflètent la réalité.
      setCancelOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["demande", id] });
      void queryClient.invalidateQueries({ queryKey: ["citizen"] });
      toast.error("Annulation impossible", getApiErrorMessage(error));
    },
  });

  function revokePreview() {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setPreviewUrl(null);
  }

  useEffect(() => revokePreviewOnUnmount, []);
  function revokePreviewOnUnmount() {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
  }

  async function handleDownload() {
    setPdfBusy(true);
    try {
      const blob = await downloadPdf(id);
      saveBlob(blob, `acte-${query.data?.numero ?? id}.pdf`);
    } catch (error) {
      toast.error("Téléchargement impossible", await getBlobErrorMessage(error));
    } finally {
      setPdfBusy(false);
    }
  }

  async function openPreview() {
    setPreviewOpen(true);
    setPreviewError(null);
    if (previewUrlRef.current) return; // déjà chargé
    setPreviewLoading(true);
    try {
      const blob = await downloadPdf(id);
      const url = URL.createObjectURL(
        blob.type === "application/pdf" ? blob : new Blob([blob], { type: "application/pdf" }),
      );
      previewUrlRef.current = url;
      setPreviewUrl(url);
    } catch (error) {
      setPreviewError(await getBlobErrorMessage(error));
    } finally {
      setPreviewLoading(false);
    }
  }

  function closePreview() {
    setPreviewOpen(false);
    revokePreview();
  }

  async function handlePieceDownload(pieceId: number, filename: string) {
    setPieceBusy(pieceId);
    try {
      saveBlob(await downloadPiece(id, pieceId), filename);
    } catch (error) {
      toast.error("Téléchargement impossible", await getBlobErrorMessage(error));
    } finally {
      setPieceBusy(null);
    }
  }

  if (!validId) {
    return (
      <div className="space-y-4">
        <Alert variant="danger">Identifiant de demande invalide.</Alert>
        <Link to="/app/demandes" className="text-sm font-medium text-primary hover:underline">
          Retour à mes demandes
        </Link>
      </div>
    );
  }

  if (query.isLoading) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Chargement de la demande">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (query.isError) {
    const status = axios.isAxiosError(query.error) ? query.error.response?.status : undefined;
    const notAccessible = status === 403 || status === 404;
    return (
      <div className="space-y-4">
        <Alert
          variant="danger"
          title={notAccessible ? "Demande introuvable" : "Impossible de charger la demande"}
        >
          <p>{getApiErrorMessage(query.error)}</p>
          {!notAccessible ? (
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
          ) : null}
        </Alert>
        <Link to="/app/demandes" className="text-sm font-medium text-primary hover:underline">
          Retour à mes demandes
        </Link>
      </div>
    );
  }

  if (!query.data) return null;

  const demande = query.data;
  const canDownload = ["signee", "archivee"].includes(demande.statut);
  const canCancel = demande.statut === "demandee";

  const schema = (types.data?.find((type) => type.code === demande.type.code)?.form_schema ?? [])
    .filter((field) => field.type !== "file");
  const known = new Set(schema.map((field) => field.name));
  const dataRows = [
    ...schema
      .filter((field) => field.name in demande.donnees)
      .map((field) => ({
        key: field.name,
        label: field.label,
        text: formatValue(demande.donnees[field.name], field),
      })),
    ...Object.entries(demande.donnees)
      .filter(([key]) => !known.has(key))
      .map(([key, value]) => ({ key, label: humanizeKey(key), text: formatValue(value) })),
  ];

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
              <>
                <Button
                  variant="secondary"
                  leftIcon={<LuEye className="h-4 w-4" aria-hidden="true" />}
                  onClick={() => void openPreview()}
                >
                  Aperçu du PDF
                </Button>
                <Button
                  isLoading={pdfBusy}
                  leftIcon={<LuDownload className="h-4 w-4" aria-hidden="true" />}
                  onClick={() => void handleDownload()}
                >
                  Télécharger le PDF
                </Button>
              </>
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
          <p>
            {demande.complement_message ??
              "L'agent a demandé une information complémentaire."}
          </p>
          <p className="mt-2 text-xs">
            La réponse en ligne à un complément n'est pas encore disponible dans l'application.
          </p>
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
              {dataRows.length === 0 ? (
                <p className="text-sm text-ink-soft">Aucune donnée saisie.</p>
              ) : (
                <dl className="grid gap-4 sm:grid-cols-2">
                  {dataRows.map((row) => (
                    <div key={row.key}>
                      <dt className="text-xs uppercase tracking-wide text-ink-soft">
                        {row.label}
                      </dt>
                      <dd className="mt-1 whitespace-pre-line break-words text-sm text-ink">
                        {row.text}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
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
                            {CONTENT_TYPE_LABELS[piece.content_type] ?? piece.content_type}
                            {" · "}
                            {formatFileSize(piece.size_bytes)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Télécharger ${piece.filename}`}
                        isLoading={pieceBusy === piece.id}
                        disabled={pieceBusy !== null}
                        leftIcon={<LuDownload className="h-4 w-4" aria-hidden="true" />}
                        onClick={() => void handlePieceDownload(piece.id, piece.filename)}
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
                <div className="space-y-3" aria-busy="true" aria-label="Chargement de l'historique">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : history.isError ? (
                <div className="space-y-2">
                  <p className="text-sm text-ink-soft">
                    L'historique n'est pas disponible pour le moment.
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    isLoading={history.isFetching}
                    leftIcon={<LuRefreshCw className="h-4 w-4" aria-hidden="true" />}
                    onClick={() => void history.refetch()}
                  >
                    Réessayer
                  </Button>
                </div>
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
                    {demande.signature.signataire.prenom} {demande.signature.signataire.nom}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink-soft">Signé le</p>
                  <p className="mt-1 text-ink">
                    {formatDateTime(demande.signed_at ?? demande.signature.signe_le)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink-soft">
                    {demande.signature.algorithme}
                  </p>
                  <p className="mt-1 break-all font-mono text-xs text-ink-soft">
                    {demande.signature.sha256_acte_json}
                  </p>
                </div>
                <Link
                  to={`/verifier/${encodeURIComponent(demande.numero)}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  Vérifier l'authenticité de l'acte
                  <LuExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
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

      <Modal
        open={previewOpen}
        onClose={closePreview}
        size="lg"
        title={`Aperçu de l'acte ${demande.numero}`}
        footer={
          <>
            <Button variant="secondary" onClick={closePreview}>
              Fermer
            </Button>
            <Button
              isLoading={pdfBusy}
              leftIcon={<LuDownload className="h-4 w-4" aria-hidden="true" />}
              onClick={() => void handleDownload()}
            >
              Télécharger le PDF
            </Button>
          </>
        }
      >
        {previewLoading ? (
          <div className="flex h-64 items-center justify-center gap-3 text-sm text-ink-soft">
            <Spinner />
            Chargement de l'aperçu…
          </div>
        ) : previewError ? (
          <Alert variant="danger" title="Aperçu indisponible">
            {previewError}
          </Alert>
        ) : previewUrl ? (
          <iframe
            title={`Aperçu du PDF de l'acte ${demande.numero}`}
            src={previewUrl}
            className="h-[65vh] w-full rounded-md border border-line bg-surface-muted"
          />
        ) : null}
      </Modal>
    </div>
  );
}
