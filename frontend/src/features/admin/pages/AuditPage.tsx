/**
 * Journal d'audit.
 * Propriétaire : NZEUTEM DOMOE EUNICE FELIXTINE
 * TODO :
  [ ] Ajouter les filtres par acteur et par date.
  [ ] Tester la pagination.
 */

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { LuScrollText, LuSearch } from "react-icons/lu";

import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { fetchAudit } from "@/features/admin/api";
import { getApiErrorMessage } from "@/lib/api";
import { formatDateTime, fullName } from "@/lib/format";

export function AdminAuditPage() {
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ["admin", "audit", action, page],
    queryFn: () =>
      fetchAudit({
        action: action || undefined,
        page,
        page_size: 20,
      }),
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Administration"
        title="Journal d'audit"
        description="Consultez les actions sensibles réalisées sur la plateforme."
      />

      <div className="max-w-md">
        <Input
          aria-label="Filtrer par action"
          placeholder="Filtrer par action (ex. signature)"
          value={action}
          onChange={(event) => {
            setAction(event.target.value);
            setPage(1);
          }}
          leftIcon={<LuSearch className="h-4 w-4" aria-hidden="true" />}
        />
      </div>

      {query.isError ? (
        <Alert variant="danger" title="Journal indisponible">
          {getApiErrorMessage(query.error)}
        </Alert>
      ) : null}

      {query.isLoading ? (
        <Skeleton className="h-80 w-full" />
      ) : query.data?.items.length ? (
        <>
          <Table caption="Événements d'audit">
            <THead>
              <TR>
                <TH>Date</TH>
                <TH>Acteur</TH>
                <TH>Action</TH>
                <TH>Dossier</TH>
                <TH>Commit</TH>
              </TR>
            </THead>
            <TBody>
              {query.data.items.map((event) => (
                <TR key={event.id}>
                  <TD className="whitespace-nowrap text-ink-soft">
                    {formatDateTime(event.created_at)}
                  </TD>
                  <TD className="text-ink">
                    {event.actor ? fullName(event.actor) : "Système"}
                  </TD>
                  <TD>
                    <span className="font-mono text-xs text-ink">{event.action}</span>
                  </TD>
                  <TD className="text-ink-soft">
                    {event.demande_id ? `#${event.demande_id}` : "—"}
                  </TD>
                  <TD className="font-mono text-xs text-ink-soft">
                    {event.commit_sha ? event.commit_sha.slice(0, 10) : "—"}
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
          icon={LuScrollText}
          title="Aucun événement"
          description="Les actions d'administration et de workflow apparaîtront ici."
        />
      )}
    </div>
  );
}
