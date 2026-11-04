/**
 * Tests de la liste des demandes (filtres, recherche, pagination).
 * Propriétaire : JEUDIEU TSAGUE AUDREY DANIELLE
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CitizenRequestsPage } from "@/features/citizen/pages/RequestsPage";
import type { DemandeListItem, Page, Statut } from "@/types";

vi.mock("@/features/citizen/api", () => ({ fetchDemandes: vi.fn() }));
import { fetchDemandes } from "@/features/citizen/api";
const fetchMock = vi.mocked(fetchDemandes);

function item(id: number, statut: Statut = "demandee"): DemandeListItem {
  return {
    id,
    numero: `2026-0000${id}`,
    type: { id: 1, code: "a", label: `Acte ${id}` },
    demandeur: { id: 1, first_name: "Awa", last_name: "Ndiaye", role: "citoyen" },
    statut,
    assigned_agent: null,
    pr_url: null,
    created_at: "2026-10-01T09:00:00Z",
    updated_at: "2026-10-01T09:00:00Z",
  };
}
function page(items: DemandeListItem[], extra: Partial<Page<DemandeListItem>> = {}): Page<DemandeListItem> {
  return { items, total: items.length, page: 1, page_size: 12, pages: 1, ...extra };
}

function Location() {
  const l = useLocation();
  return <p data-testid="loc">{l.search}</p>;
}
function renderPage(url = "/app/demandes") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[url]}>
        <CitizenRequestsPage />
        <Location />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => fetchMock.mockReset());

describe("liste des demandes", () => {
  it("affiche les demandes et le total", async () => {
    fetchMock.mockResolvedValue(page([item(1), item(2)]));
    renderPage();
    expect(await screen.findByText("Acte 1")).toBeInTheDocument();
    expect(screen.getByText("2 demandes")).toBeInTheDocument();
  });

  it("filtre par statut via les onglets et met à jour l'URL", async () => {
    fetchMock.mockResolvedValue(page([item(1)]));
    renderPage();
    await screen.findByText("Acte 1");
    await userEvent.click(screen.getByRole("tab", { name: "Signée" }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenLastCalledWith(expect.objectContaining({ statut: "signee", page: 1 })),
    );
    expect(screen.getByTestId("loc")).toHaveTextContent("statut=signee");
    expect(screen.getByRole("tab", { name: "Signée" })).toHaveAttribute("aria-selected", "true");
  });

  it("lit le statut dans l'URL et ignore une valeur invalide", async () => {
    fetchMock.mockResolvedValue(page([item(1)]));
    renderPage("/app/demandes?statut=signee");
    await screen.findByText("Acte 1");
    expect(fetchMock).toHaveBeenCalledWith(expect.objectContaining({ statut: "signee" }));
  });

  it("recherche en texte intégral avec délai et retour en page 1", async () => {
    fetchMock.mockResolvedValue(page([item(1)], { pages: 3 }));
    renderPage("/app/demandes?page=2");
    await screen.findByText("Acte 1");
    await userEvent.type(screen.getByRole("searchbox", { name: "Rechercher une demande" }), "00042");
    await waitFor(() =>
      expect(fetchMock).toHaveBeenLastCalledWith(expect.objectContaining({ q: "00042", page: 1 })),
    );
    expect(fetchMock.mock.calls.filter(([p]) => p?.q).length).toBe(1);
    expect(screen.getByTestId("loc")).toHaveTextContent("q=00042");
  });

  it("pagine avec Suivant / Précédent", async () => {
    fetchMock.mockImplementation(async (p) => page([item(p?.page ?? 1)], { page: p?.page ?? 1, pages: 3 }));
    renderPage();
    await screen.findByText("Acte 1");
    await userEvent.click(screen.getByRole("button", { name: /Suivant/ }));
    expect(await screen.findByText("Acte 2")).toBeInTheDocument();
    expect(screen.getByTestId("loc")).toHaveTextContent("page=2");
    await userEvent.click(screen.getByRole("button", { name: /Précédent/ }));
    expect(await screen.findByText("Acte 1")).toBeInTheDocument();
  });

  it("revient à la dernière page si la page demandée n'existe plus", async () => {
    fetchMock.mockImplementation(async (p) =>
      (p?.page ?? 1) > 2 ? page([], { page: p?.page, pages: 2, total: 0 }) : page([item(1)], { pages: 2 }),
    );
    renderPage("/app/demandes?page=5");
    await waitFor(() => expect(screen.getByTestId("loc")).toHaveTextContent("page=2"));
  });

  it("état vide sans filtre, puis état « aucun résultat » avec réinitialisation", async () => {
    fetchMock.mockResolvedValue(page([], { pages: 0 }));
    const first = renderPage();
    expect(await screen.findByText("Aucune demande pour le moment")).toBeInTheDocument();
    first.unmount();

    renderPage("/app/demandes?q=zzz");
    expect(await screen.findByText("Aucune demande ne correspond")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Réinitialiser les filtres" }));
    await waitFor(() => expect(screen.getByTestId("loc")).toHaveTextContent(/^$/));
  });

  it("affiche l'erreur sans état vide et permet de réessayer", async () => {
    fetchMock.mockRejectedValue(new Error("Panne"));
    renderPage();
    expect(await screen.findByText("Impossible de charger les demandes")).toBeInTheDocument();
    expect(screen.queryByText("Aucune demande pour le moment")).not.toBeInTheDocument();
    fetchMock.mockResolvedValue(page([item(1)]));
    await userEvent.click(screen.getByRole("button", { name: /Réessayer/ }));
    expect(await screen.findByText("Acte 1")).toBeInTheDocument();
  });
});
