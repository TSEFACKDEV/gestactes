/**
 * File de validation.
 * Propriétaire : METAMMO TEUMA DANIELA CLEDYA
 * TODO :
 *  [ ] Ajouter les filtres par type et par date.
 *  [ ] Tester les statuts validée/signée/archivée.
 */

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { LuClipboardCheck, LuSearch } from "react-icons/lu";
import { Link } from "react-router-dom";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { Tabs } from "@/components/ui/Tabs";
import { fetchQueue } from "@/features/validator/api";
import { getApiErrorMessage } from "@/lib/api";
import { formatDate, fullName } from "@/lib/format";
import type { Statut } from "@/types";

const TABS = [
  { id: "en_validation", label: "À valider" },
  { id: "validee", label: "Validées" },
  { id: "signee", label: "Signées" },
  { id: "archivee", label: "Archivées" },
];

export function ValidatorQueuePage() {
  const [statut, setStatut] = useState<Statut>("en_validation");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ["validator", "queue", statut, q, page],
    queryFn: () =>
      fetchQueue({
        statut,
        q: q || undefined,
        page,
        page_size: 20,
      }),
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Espace validateur"
        title="File de validation"
        description="Contrôlez les actes instruits, approuvez-les ou demandez des corrections."
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <Tabs
          items={TABS}
          value={statut}
          onChange={(value) => {
            setStatut(value as Statut);
            setPage(1);
          }}
          className="flex-1"
        />
        <div className="w-full lg:w-64">
          <Input
            aria-label="Rechercher un dossier"
            placeholder="Numéro ou demandeur"
            value={q}
            onChange={(event) => {
              setQ(event.target.value);
              setPage(1);
            }}
            leftIcon={<LuSearch className="h-4 w-4" aria-hidden="true" />}
          />
        </div>
      </div>

      {query.isError ? (
        <Alert variant="danger" title="Impossible de charger la file">
          {getApiErrorMessage(query.error)}
        </Alert>
      ) : null}

      {query.isLoading ? (
        <Skeleton className="h-80 w-full" />
      ) : query.data?.items.length ? (
        <>
          <Table caption="Actes à valider">
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
                    <Link to={`/app/validation/demandes/${demande.id}`}>
                      <Button size="sm" variant="secondary">
                        {demande.statut === "en_validation" ? "Examiner" : "Consulter"}
                      </Button>
                    </Link>
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
          icon={LuClipboardCheck}
          title="Aucun acte dans cette file"
          description="Les actes soumis par les agents apparaîtront ici."
        />
      )}
    </div>
  );
}
