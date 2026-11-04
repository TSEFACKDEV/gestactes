/**
 * Tests du tableau de bord citoyen.
 * Propriétaire : JEUDIEU TSAGUE AUDREY DANIELLE
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CitizenDashboardPage } from "@/features/citizen/pages/DashboardPage";
import type { DemandeListItem, Page, Statut } from "@/types";

vi.mock("@/features/citizen/api", () => ({
  fetchDemandes: vi.fn(),
}));

import { fetchDemandes } from "@/features/citizen/api";

const fetchDemandesMock = vi.mocked(fetchDemandes);

function item(id: number, statut: Statut, createdAt: string): DemandeListItem {
  return {
    id,
    numero: `2026-0000${id}`,
    type: { id: 1, code: "attestation-residence", label: "Attestation de résidence" },
    demandeur: { id: 1, first_name: "Awa", last_name: "Ndiaye", role: "citoyen" },
    statut,
    assigned_agent: null,
    pr_url: null,
    created_at: createdAt,
    updated_at: createdAt,
  };
}

function page(items: DemandeListItem[], total = items.length): Page<DemandeListItem> {
  return { items, total, page: 1, page_size: 5, pages: 1 };
}

/** Totaux fictifs par statut : le total « tous statuts » est 130 (> 100). */
const TOTALS: Partial<Record<Statut, number>> = {
  demandee: 2,
  en_instruction: 3,
  en_validation: 1,
  validee: 1,
  signee: 4,
  archivee: 6,
  rejetee: 5,
};

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <CitizenDashboardPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("tableau de bord citoyen", () => {
  beforeEach(() => {
    fetchDemandesMock.mockReset();
  });

  it("calcule les statistiques à partir des totaux de l'API, pas des 100 premières lignes", async () => {
    fetchDemandesMock.mockImplementation(async (params) => {
      if (params?.statut) return page([], TOTALS[params.statut] ?? 0);
      return page([item(1, "demandee", "2026-10-01T09:00:00Z")], 130);
    });
    renderPage();

    await waitFor(() => expect(screen.getByTestId("stat-total")).toHaveTextContent("130"));
    expect(screen.getByTestId("stat-enCours")).toHaveTextContent("7"); // 2+3+1+1
    expect(screen.getByTestId("stat-signees")).toHaveTextContent("10"); // 4+6
    expect(screen.getByTestId("stat-rejetees")).toHaveTextContent("5");
  });

  it("affiche les demandes récentes, les plus récentes d'abord", async () => {
    fetchDemandesMock.mockImplementation(async (params) =>
      params?.statut
        ? page([], 0)
        : page(
            [
              item(1, "demandee", "2026-10-01T09:00:00Z"),
              item(2, "signee", "2026-10-05T09:00:00Z"),
            ],
            2,
          ),
    );
    renderPage();

    const links = await screen.findAllByRole("link", { name: /Attestation de résidence/ });
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "/app/demandes/2");
    expect(links[1]).toHaveAttribute("href", "/app/demandes/1");
  });

  it("propose les actions rapides", async () => {
    fetchDemandesMock.mockResolvedValue(page([]));
    renderPage();

    expect(screen.getByRole("link", { name: /Suivre mes demandes/ })).toHaveAttribute(
      "href",
      "/app/demandes",
    );
    expect(screen.getByRole("link", { name: /Vérifier un acte/ })).toHaveAttribute(
      "href",
      "/verification",
    );
    expect(screen.getAllByRole("link", { name: /Nouvelle demande/ })[0]).toHaveAttribute(
      "href",
      "/app/catalogue",
    );
    await screen.findByText("Aucune demande pour le moment");
  });

  it("affiche l'état vide quand le citoyen n'a aucune demande", async () => {
    fetchDemandesMock.mockResolvedValue(page([], 0));
    renderPage();

    expect(await screen.findByText("Aucune demande pour le moment")).toBeInTheDocument();
    expect(screen.getByTestId("stat-total")).toHaveTextContent("0");
  });

  it("affiche une erreur avec un bouton Réessayer, sans état vide trompeur", async () => {
    fetchDemandesMock.mockRejectedValue(new Error("Serveur indisponible"));
    renderPage();

    expect(await screen.findByText("Impossible de charger vos demandes")).toBeInTheDocument();
    expect(screen.getByText("Serveur indisponible")).toBeInTheDocument();
    expect(screen.queryByText("Aucune demande pour le moment")).not.toBeInTheDocument();
    expect(screen.getByTestId("stat-total")).toHaveTextContent("—");

    fetchDemandesMock.mockResolvedValue(page([], 0));
    await userEvent.click(screen.getByRole("button", { name: /Réessayer/ }));
    await waitFor(() =>
      expect(screen.queryByText("Impossible de charger vos demandes")).not.toBeInTheDocument(),
    );
  });
});
