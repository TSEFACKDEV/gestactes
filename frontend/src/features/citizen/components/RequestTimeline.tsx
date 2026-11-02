/**
 * Timeline d'une demande.
 * Propriétaire : JEUDIEU TSAGUE AUDREY DANIELLE
 * TODO : brancher les données réelles et couvrir les états d'erreur.
 */

import { Timeline, type TimelineItem } from "@/components/ui/Timeline";
import { formatDateTime } from "@/lib/format";
import type { HistoriqueItem } from "@/types";

export function RequestTimeline({ items }: { items: HistoriqueItem[] }) {
  const timelineItems: TimelineItem[] = items.map((item, index) => ({
    id: `${item.type}-${item.sha ?? index}`,
    title: item.action,
    description: `${item.actor} — ${item.message}`,
    date: formatDateTime(item.created_at),
    status: index === items.length - 1 ? "current" : "done",
  }));

  return <Timeline items={timelineItems} />;
}
