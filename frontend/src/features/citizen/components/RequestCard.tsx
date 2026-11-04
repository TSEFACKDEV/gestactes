/**
 * Carte de demande (liste et tableau de bord).
 * Propriétaire : JEUDIEU TSAGUE AUDREY DANIELLE
 */

import { LuArrowUpRight, LuCalendar, LuUser } from "react-icons/lu";
import { Link } from "react-router-dom";

import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, formatRelative, fullName } from "@/lib/format";
import type { DemandeListItem } from "@/types";

export function RequestCard({ demande }: { demande: DemandeListItem }) {
  return (
    <Link to={`/app/demandes/${demande.id}`} className="group block">
      <Card className="h-full p-5 transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-lifted">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-xs font-medium text-accent">{demande.numero}</p>
            <h3 className="mt-1 truncate font-display text-base font-semibold text-ink">
              {demande.type.label}
            </h3>
          </div>
          <LuArrowUpRight
            className="h-4 w-4 shrink-0 text-ink-soft transition group-hover:text-primary"
            aria-hidden="true"
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <StatusBadge statut={demande.statut} />
          <span className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
            <LuCalendar className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Déposée le {formatDate(demande.created_at)}</span>
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-soft">
          {demande.assigned_agent ? (
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <LuUser className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">Agent : {fullName(demande.assigned_agent)}</span>
            </span>
          ) : (
            <span />
          )}
          <span>Mise à jour {formatRelative(demande.updated_at)}</span>
        </div>
      </Card>
    </Link>
  );
}
