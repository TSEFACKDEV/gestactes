/**
 * Tests du catalogue citoyen.
 * Propriétaire : JEUDIEU TSAGUE AUDREY DANIELLE
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CitizenCataloguePage } from "@/features/citizen/pages/CataloguePage";
import type { TypeActe } from "@/types";

vi.mock("@/features/citizen/api", () => ({
  fetchTypes: vi.fn(),
}));

import { fetchTypes } from "@/features/citizen/api";

const fetchTypesMock = vi.mocked(fetchTypes);

const TYPES: TypeActe[] = [
  {
    id: 1,
    code: "attestation-residence",
    label: "Attestation de résidence",
    description: "Atteste du lieu de résidence du demandeur.",
    form_schema: [
      { name: "adresse", label: "Adresse complète", type: "textarea", required: true },
      { name: "residence_depuis", label: "Résident depuis", type: "date", required: true },
      { name: "motif", label: "Motif", type: "text", required: false },
    ],
    template_md: "",
    is_active: true,
  },
  {
    id: 2,
    code: "extrait naissance/été",
    label: "Extrait de naissance",
    description: "Copie d'un acte de naissance.",
    form_schema: [{ name: "nom", label: "Nom", type: "text", required: true }],
    template_md: "",
    is_active: true,
  },
];

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <CitizenCataloguePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("catalogue citoyen", () => {
  beforeEach(() => {
    fetchTypesMock.mockReset();
  });

  it("affiche les types d'actes renvoyés par l'API avec leurs informations utiles", async () => {
    fetchTypesMock.mockResolvedValue(TYPES);
    renderPage();

    expect(await screen.findByText("Attestation de résidence")).toBeInTheDocument();
    expect(screen.getByText("Atteste du lieu de résidence du demandeur.")).toBeInTheDocument();
    expect(screen.getByText(/3 champs à renseigner dont 2 obligatoires/)).toBeInTheDocument();
    expect(screen.getByText("Adresse complète")).toBeInTheDocument();
    expect(screen.getByText(/1 champ à renseigner dont 1 obligatoire/)).toBeInTheDocument();
    expect(screen.getAllByText(/Pièces facultatives : 3 max\., 5 Mo, PDF\/JPEG\/PNG/)).toHaveLength(2);
  });

  it("renvoie vers le formulaire du type choisi (code encodé)", async () => {
    fetchTypesMock.mockResolvedValue(TYPES);
    renderPage();

    const first = await screen.findByRole("link", { name: "Choisir Attestation de résidence" });
    expect(first).toHaveAttribute("href", "/app/demandes/nouvelle?type=attestation-residence");
    expect(screen.getByRole("link", { name: "Choisir Extrait de naissance" })).toHaveAttribute(
      "href",
      "/app/demandes/nouvelle?type=extrait%20naissance%2F%C3%A9t%C3%A9",
    );
  });

  it("affiche l'état vide quand le catalogue est vide", async () => {
    fetchTypesMock.mockResolvedValue([]);
    renderPage();

    expect(await screen.findByText("Aucun type d'acte disponible")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Choisir/ })).not.toBeInTheDocument();
  });

  it("affiche l'erreur API sans état vide, puis se rétablit au réessai", async () => {
    fetchTypesMock.mockRejectedValue(new Error("API indisponible"));
    renderPage();

    expect(await screen.findByText("Catalogue indisponible")).toBeInTheDocument();
    expect(screen.getByText("API indisponible")).toBeInTheDocument();
    expect(screen.queryByText("Aucun type d'acte disponible")).not.toBeInTheDocument();

    fetchTypesMock.mockResolvedValue(TYPES);
    await userEvent.click(screen.getByRole("button", { name: /Réessayer/ }));
    expect(await screen.findByText("Attestation de résidence")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("Catalogue indisponible")).not.toBeInTheDocument());
  });

  it("affiche un état de chargement accessible", () => {
    fetchTypesMock.mockReturnValue(new Promise(() => {}));
    renderPage();

    expect(screen.getByLabelText("Chargement du catalogue")).toHaveAttribute("aria-busy", "true");
  });
});
