/**
 * Éditeur d'instruction.
 * Propriétaire : LEUKAM TCHEUMALEU MAXIME
 * TODO :
 *  [ ] Ajouter un aperçu Markdown du brouillon.
 *  [ ] Tester l'enregistrement et la soumission.
 *  [ ] Gérer les conflits 409.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { LuEye, LuSave, LuSend, LuTriangleAlert } from "react-icons/lu";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/context/ToastContext";
import {
  requestComplement,
  submitDemande,
  updateContent,
} from "@/features/agent/api";
import { getApiErrorMessage } from "@/lib/api";
import type { Demande } from "@/types";

export function InstructionEditor({ demande }: { demande: Demande }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [acteMd, setActeMd] = useState(demande.acte_md ?? "");
  const [message, setMessage] = useState("");
  const [complement, setComplement] = useState("");
  const [error, setError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateContent(demande.id, {
        acte_md: acteMd,
        message: message || "mise à jour du brouillon",
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["agent", "demande", demande.id], updated);
      queryClient.invalidateQueries({ queryKey: ["agent", "historique", demande.id] });
      setMessage("");
      toast.success("Brouillon enregistré", "Un commit a été créé.");
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const complementMutation = useMutation({
    mutationFn: () => requestComplement(demande.id, complement.trim()),
    onSuccess: (updated) => {
      queryClient.setQueryData(["agent", "demande", demande.id], updated);
      setComplement("");
      toast.success("Complément demandé", "Le citoyen sera notifié.");
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const submitMutation = useMutation({
    mutationFn: () => submitDemande(demande.id, message || undefined),
    onSuccess: (updated) => {
      queryClient.setQueryData(["agent", "demande", demande.id], updated);
      toast.success("Acte soumis", "La Pull Request de validation est ouverte.");
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const busy = saveMutation.isPending || complementMutation.isPending || submitMutation.isPending;

  const renderedPreview = useMemo(() => {
    return acteMd
      .split(/\n{2,}/)
      .map((block) => {
        const trimmed = block.trim();
        if (!trimmed) return "";
        if (trimmed.startsWith("#")) {
          return `<h1>${trimmed.replace(/^#+\s*/, "")}</h1>`;
        }
        if (trimmed.startsWith("##")) {
          return `<h2>${trimmed.replace(/^#+\s*/, "")}</h2>`;
        }
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const items = trimmed
            .split(/\n/)
            .map((item) => `<li>${item.replace(/^[-*]\s*/, "")}</li>`)
            .join("");
          return `<ul>${items}</ul>`;
        }
        return `<p>${trimmed.replace(/\n/g, "<br />")}</p>`;
      })
      .join("");
  }, [acteMd]);

  return (
    <div className="space-y-6">
      {error ? <Alert variant="danger">{error}</Alert> : null}
      {demande.complement_attendu ? (
        <Alert variant="warning" title="Complément en attente">
          {demande.complement_message ?? "Le citoyen doit fournir une information."}
        </Alert>
      ) : null}

      <Card>
        <CardHeader
          title="Brouillon de l'acte"
          description="Le contenu est versionné à chaque enregistrement."
        />
        <CardBody className="space-y-4">
          <Textarea
            label="Contenu Markdown de l'acte"
            value={acteMd}
            onChange={(event) => setActeMd(event.target.value)}
            rows={16}
            className="font-mono text-xs leading-relaxed"
            placeholder="# Attestation de résidence..."
          />
          <div className="rounded-lg border border-line bg-surface-muted p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-ink">Aperçu</p>
              <span className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
                <LuEye className="h-3.5 w-3.5" aria-hidden="true" />
                HTML simplifié
              </span>
            </div>
            <div
              className="prose prose-sm max-w-none text-sm leading-relaxed text-ink-soft"
              dangerouslySetInnerHTML={{ __html: renderedPreview || "<p>Aucun contenu pour l’instant.</p>" }}
            />
          </div>
          <Textarea
            label="Message de commit"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={2}
            placeholder="Ex. : correction de l'adresse"
            hint="Facultatif. Un message par défaut est utilisé si vide."
          />
        </CardBody>
        <CardFooter>
          <Button
            variant="secondary"
            leftIcon={<LuSave className="h-4 w-4" aria-hidden="true" />}
            isLoading={saveMutation.isPending}
            disabled={busy || !acteMd.trim()}
            onClick={() => saveMutation.mutate()}
          >
            Enregistrer le brouillon
          </Button>
        </CardFooter>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Demander un complément"
            description="Le citoyen reçoit une notification et peut compléter son dossier."
          />
          <CardBody>
            <Textarea
              label="Message au citoyen"
              value={complement}
              onChange={(event) => setComplement(event.target.value)}
              rows={4}
              placeholder="Merci de joindre un justificatif de domicile de moins de 3 mois."
            />
          </CardBody>
          <CardFooter>
            <Button
              variant="secondary"
              leftIcon={<LuTriangleAlert className="h-4 w-4" aria-hidden="true" />}
              isLoading={complementMutation.isPending}
              disabled={busy || complement.trim().length < 3}
              onClick={() => complementMutation.mutate()}
            >
              Demander le complément
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader
            title="Soumettre à validation"
            description="Une Pull Request sera ouverte vers la branche principale."
          />
          <CardBody>
            <p className="text-sm leading-relaxed text-ink-soft">
              Vérifiez le contenu avant de soumettre. Le validateur pourra
              approuver, demander des corrections ou rejeter l'acte.
            </p>
          </CardBody>
          <CardFooter>
            <Button
              leftIcon={<LuSend className="h-4 w-4" aria-hidden="true" />}
              isLoading={submitMutation.isPending}
              disabled={busy || !acteMd.trim()}
              onClick={() => submitMutation.mutate()}
            >
              Soumettre à validation
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
