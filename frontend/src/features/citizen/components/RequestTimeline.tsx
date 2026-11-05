/**
 * Timeline d'une demande (commits et événements d'audit).
 * Propriétaire : JEUDIEU TSAGUE AUDREY DANIELLE
 *
 * `GET /demandes/{id}/historique` renvoie des actions en texte libre ; les
 * actions connues du workflow (docs/workflow.md) sont traduites, les autres
 * sont affichées lisiblement telles quelles.
 */

import { Timeline, type TimelineItem } from "@/components/ui/Timeline";
import { formatDateTime } from "@/lib/format";
import type { HistoriqueItem } from "@/types";
import { eventDescription } from "@/lib/demande";

const ACTION_LABELS: Record<string, string> = {
  creation: "Demande déposée",
  depot: "Demande déposée",
  depot_demande: "Demande déposée",
  annulation: "Demande annulée",
  annuler: "Demande annulée",
  prise_en_charge: "Prise en charge",
  prendre_en_charge: "Prise en charge",
  instruction: "Instruction du dossier",
  complement: "Complément demandé",
  demande_complement: "Complément demandé",
  soumission: "Soumise à validation",
  soumettre: "Soumise à validation",
  approbation: "Acte approuvé",
  approuver: "Acte approuvé",
  demander_corrections: "Corrections demandées",
  corrections: "Corrections demandées",
  rejet: "Demande rejetée",
  rejeter: "Demande rejetée",
  signature: "Acte signé",
  signer: "Acte signé",
  archivage: "Acte archivé",
  archiver: "Acte archivé",
};

export function actionLabel(action: string): string {
  const key = action.trim().toLowerCase();
  const known = ACTION_LABELS[key];
  if (known) return known;
  const spaced = key.replace(/[_-]+/g, " ");
  return spaced ? spaced.charAt(0).toUpperCase() + spaced.slice(1) : "Événement";
}

function describe(item: HistoriqueItem): string {
  const text = eventDescription(item.actor, item.message);
  return item.type === "commit" && item.sha ? `${text} (commit ${item.sha.slice(0, 7)})` : text;
}

export function RequestTimeline({ items }: { items: HistoriqueItem[] }) {
  // Ordre chronologique, de la plus ancienne à la plus récente (tri stable).
  const ordered = items
    .map((item, index) => ({ item, index }))
    .sort(
      (a, b) =>
        Date.parse(a.item.created_at) - Date.parse(b.item.created_at) || a.index - b.index,
    )
    .map(({ item }) => item);

  const timelineItems: TimelineItem[] = ordered.map((item, index) => ({
    id: `${item.type}-${index}`,
    title: actionLabel(item.action),
    description: describe(item),
    date: formatDateTime(item.created_at),
    status: index === ordered.length - 1 ? "current" : "done",
  }));

  return <Timeline items={timelineItems} />;
}
