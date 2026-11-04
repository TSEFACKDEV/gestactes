/**
 * Liste des demandes du citoyen : filtres par statut, recherche et pagination.
 * Propriétaire : JEUDIEU TSAGUE AUDREY DANIELLE
 *
 * Les filtres vivent dans l'URL (`?statut=…&q=…&page=…`) : la liste survit au
 * rechargement, au bouton « précédent » et peut être partagée. La recherche
 * utilise le paramètre `q` du contrat (numéro, libellé du type…) ; le citoyen
 * ne voit de toute façon que ses propres demandes.
 */

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { LuFileText, LuPlus, LuRefreshCw, LuSearch } from "react-icons/lu";
import { Link, useSearchParams } from "react-router-dom";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tabs } from "@/components/ui/Tabs";
import { fetchDemandes } from "@/features/citizen/api";
import { RequestCard } from "@/features/citizen/components/RequestCard";
import { getApiErrorMessage } from "@/lib/api";
import { STATUT_LABELS } from "@/lib/constants";
import type { Statut } from "@/types";

const PAGE_SIZE = 12;
const SEARCH_MAX_LENGTH = 100; // limite du paramètre `q` côté API
const SEARCH_DEBOUNCE_MS = 350;

const TABS = [
  { id: "all", label: "Toutes" },
  ...(
    [
      "demandee",
      "en_instruction",
      "en_validation",
      "validee",
      "signee",
      "archivee",
      "rejetee",
      "annulee",
    ] as Statut[]
  ).map((statut) => ({ id: statut, label: STATUT_LABELS[statut] })),
];

const VALID_STATUTS = new Set<string>(TABS.map((tab) => tab.id).filter((id) => id !== "all"));

export function CitizenRequestsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const rawStatut = searchParams.get("statut") ?? "";
  const statut = VALID_STATUTS.has(rawStatut) ? (rawStatut as Statut) : "";
  const q = (searchParams.get("q") ?? "").slice(0, SEARCH_MAX_LENGTH);
  const rawPage = Number(searchParams.get("page"));
  const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;

  const [search, setSearch] = useState(q);

  // Les délais (recherche) et les clics doivent partir des paramètres les plus
  // récents, pas de ceux d'un rendu précédent.
  const paramsRef = useRef(searchParams);
  paramsRef.current = searchParams;

  function updateParams(
    changes: { statut?: string; q?: string; page?: number },
    options: { replace?: boolean } = {},
  ) {
    const next = new URLSearchParams(paramsRef.current);
    for (const [key, value] of Object.entries(changes)) {
      const empty = value === "" || value === undefined || (key === "page" && value === 1);
      if (empty) next.delete(key);
      else next.set(key, String(value));
    }
    setSearchParams(next, { replace: options.replace ?? false });
  }

  // Recherche avec délai : une requête par pause de frappe, retour en page 1.
  useEffect(() => {
    const trimmed = search.trim();
    if (trimmed === q) return;
    const timer = window.setTimeout(
      () => updateParams({ q: trimmed, page: 1 }, { replace: true }),
      SEARCH_DEBOUNCE_MS,
    );
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- updateParams lit les paramètres les plus récents via paramsRef
  }, [search, q]);

  // Le champ suit l'URL (bouton précédent, réinitialisation).
  useEffect(() => {
    setSearch(q);
  }, [q]);

  const query = useQuery({
    queryKey: ["citizen", "demandes", { page, statut, q }],
    queryFn: () =>
      fetchDemandes({
        page,
        page_size: PAGE_SIZE,
        statut: statut || undefined,
        q: q || undefined,
      }),
    placeholderData: keepPreviousData,
  });

  // Page hors limites (liste réduite entre-temps) : retour à la dernière page.
  const pages = query.data?.pages ?? 0;
  useEffect(() => {
    if (query.data && !query.isPlaceholderData && pages > 0 && page > pages) {
      updateParams({ page: pages }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- updateParams lit les paramètres les plus récents via paramsRef
  }, [query.data, query.isPlaceholderData, pages, page]);

  const hasFilters = Boolean(statut || q);

  function resetFilters() {
    setSearch("");
    setSearchParams({});
  }

  const items = query.data?.items ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Suivi"
        title="Mes demandes"
        description="Retrouvez toutes vos demandes et leur état d'avancement."
        actions={
          <Link to="/app/catalogue">
            <Button leftIcon={<LuPlus className="h-4 w-4" aria-hidden="true" />}>
              Nouvelle demande
            </Button>
          </Link>
        }
      />

      <div className="space-y-4">
        <form role="search" onSubmit={(event) => event.preventDefault()} className="max-w-md">
          <Input
            type="search"
            aria-label="Rechercher une demande"
            placeholder="Rechercher par numéro ou type d'acte"
            leftIcon={<LuSearch className="h-4 w-4" aria-hidden="true" />}
            maxLength={SEARCH_MAX_LENGTH}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </form>

        <Tabs
          items={TABS}
          value={statut || "all"}
          onChange={(value) =>
            updateParams({ statut: value === "all" ? "" : value, page: 1 })
          }
        />
      </div>

      {query.isError ? (
        <Alert variant="danger" title="Impossible de charger les demandes">
          <p>{getApiErrorMessage(query.error)}</p>
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
        </Alert>
      ) : query.isLoading ? (
        <div
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
          aria-busy="true"
          aria-label="Chargement des demandes"
        >
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-36 w-full" />
        </div>
      ) : items.length > 0 ? (
        <div aria-busy={query.isFetching} className="space-y-4">
          <p className="text-sm text-ink-soft" aria-live="polite">
            {query.data?.total} demande{(query.data?.total ?? 0) > 1 ? "s" : ""}
            {hasFilters ? " correspondant à votre recherche" : ""}
          </p>
          <div
            className={`grid gap-4 transition-opacity md:grid-cols-2 xl:grid-cols-3 ${
              query.isPlaceholderData ? "opacity-60" : ""
            }`}
          >
            {items.map((demande) => (
              <RequestCard key={demande.id} demande={demande} />
            ))}
          </div>
          <Pagination
            page={query.data?.page ?? page}
            pages={pages}
            onPageChange={(next) => {
              updateParams({ page: next });
              window.scrollTo({ top: 0 });
            }}
          />
        </div>
      ) : hasFilters ? (
        <EmptyState
          icon={LuSearch}
          title="Aucune demande ne correspond"
          description={
            q
              ? `Aucun résultat pour « ${q} »${statut ? ` avec le statut « ${STATUT_LABELS[statut]} »` : ""}. Vérifiez l'orthographe ou modifiez les filtres.`
              : `Vous n'avez aucune demande avec le statut « ${STATUT_LABELS[statut as Statut]} ».`
          }
          action={
            <Button variant="secondary" onClick={resetFilters}>
              Réinitialiser les filtres
            </Button>
          }
        />
      ) : (
        <EmptyState
          icon={LuFileText}
          title="Aucune demande pour le moment"
          description="Vous n'avez pas encore déposé de demande."
          action={
            <Link to="/app/catalogue">
              <Button leftIcon={<LuPlus className="h-4 w-4" aria-hidden="true" />}>
                Déposer une demande
              </Button>
            </Link>
          }
        />
      )}
    </div>
  );
}
