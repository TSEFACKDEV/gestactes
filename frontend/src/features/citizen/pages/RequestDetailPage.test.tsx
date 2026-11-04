/**
 * Tests du détail d'une demande : actions conditionnelles, pièces, PDF, historique.
 * Propriétaire : JEUDIEU TSAGUE AUDREY DANIELLE
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, type AxiosResponse } from "axios";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ToastProvider } from "@/context/ToastContext";
import { RequestDetailPage } from "@/features/citizen/pages/RequestDetailPage";
import { actionLabel } from "@/features/citizen/components/RequestTimeline";
import type { Demande, HistoriqueItem, Statut } from "@/types";

vi.mock("@/features/citizen/api", () => ({
  fetchDemande: vi.fn(),
  fetchHistorique: vi.fn(),
  fetchTypes: vi.fn(),
  cancelDemande: vi.fn(),
  downloadPdf: vi.fn(),
  downloadPiece: vi.fn(),
}));
import {
  cancelDemande,
  downloadPdf,
  downloadPiece,
  fetchDemande,
  fetchHistorique,
  fetchTypes,
} from "@/features/citizen/api";

function demande(statut: Statut, extra: Partial<Demande> = {}): Demande {
  return {
    id: 5,
    numero: "2026-00005",
    type: { id: 1, code: "attestation", label: "Attestation de résidence" },
    demandeur: { id: 1, first_name: "Awa", last_name: "Ndiaye", role: "citoyen" },
    statut,
    assigned_agent: null,
    pr_url: null,
    created_at: "2026-10-01T09:00:00Z",
    updated_at: "2026-10-02T09:00:00Z",
    donnees: { adresse: "12 rue des Lilas", residence_depuis: "2021-03-01", majeur: true },
    acte_md: null,
    issue_number: null,
    issue_url: null,
    branch_name: null,
    pr_number: null,
    assigned_validator: null,
    complement_attendu: false,
    complement_message: null,
    rejection_reason: null,
    signature: null,
    signed_at: null,
    merge_commit_sha: null,
    tag_name: null,
    pieces: [
      { id: 3, filename: "justif.pdf", content_type: "application/pdf", size_bytes: 245000, sha256: "x", created_at: "2026-10-01T09:00:00Z" },
    ],
    ...extra,
  };
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={["/app/demandes/5"]}>
          <Routes>
            <Route path="/app/demandes/:id" element={<RequestDetailPage />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

function httpError(status: number, data: unknown) {
  return new AxiosError("x", "ERR", undefined, undefined, {
    status, statusText: "", headers: {}, config: {} as never, data,
  } as AxiosResponse);
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(fetchHistorique).mockResolvedValue([]);
  vi.mocked(fetchTypes).mockResolvedValue([
    {
      id: 1, code: "attestation", label: "Attestation de résidence", description: "", template_md: "", is_active: true,
      form_schema: [
        { name: "adresse", label: "Adresse complète", type: "textarea", required: true },
        { name: "residence_depuis", label: "Résident depuis", type: "date", required: true },
        { name: "majeur", label: "Majeur", type: "checkbox", required: false },
      ],
    },
  ]);
  URL.createObjectURL = vi.fn(() => "blob:test");
  URL.revokeObjectURL = vi.fn();
});

describe("détail d'une demande", () => {
  it("affiche les données avec les libellés du schéma et les valeurs formatées", async () => {
    vi.mocked(fetchDemande).mockResolvedValue(demande("en_instruction"));
    renderPage();
    expect(await screen.findByText("Adresse complète")).toBeInTheDocument();
    expect(screen.getByText("12 rue des Lilas")).toBeInTheDocument();
    expect(screen.getByText("01 mars 2021")).toBeInTheDocument();
    expect(screen.getByText("Oui")).toBeInTheDocument();
    expect(screen.getByText(/PDF · 239 Ko/)).toBeInTheDocument();
  });

  it("affiche le bouton d'annulation uniquement au statut demandee", async () => {
    vi.mocked(fetchDemande).mockResolvedValue(demande("demandee"));
    const first = renderPage();
    expect(await screen.findByRole("button", { name: "Annuler" })).toBeInTheDocument();
    first.unmount();

    for (const statut of ["en_instruction", "en_validation", "validee", "signee", "archivee", "rejetee", "annulee"] as Statut[]) {
      vi.mocked(fetchDemande).mockResolvedValue(demande(statut));
      const view = renderPage();
      await screen.findByText("Informations du dossier");
      expect(screen.queryByRole("button", { name: "Annuler" })).not.toBeInTheDocument();
      view.unmount();
    }
  });

  it("annule après confirmation", async () => {
    vi.mocked(fetchDemande).mockResolvedValue(demande("demandee"));
    vi.mocked(cancelDemande).mockResolvedValue(demande("annulee"));
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: "Annuler" }));
    await userEvent.click(screen.getByRole("button", { name: "Annuler la demande" }));
    await waitFor(() => expect(cancelDemande).toHaveBeenCalledWith(5));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Annuler" })).not.toBeInTheDocument());
  });

  it("gère un 409 à l'annulation : message et rafraîchissement du statut", async () => {
    vi.mocked(fetchDemande).mockResolvedValueOnce(demande("demandee"));
    vi.mocked(cancelDemande).mockRejectedValue(httpError(409, { error: { message: "Déjà prise en charge" } }));
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: "Annuler" }));
    vi.mocked(fetchDemande).mockResolvedValue(demande("en_instruction"));
    await userEvent.click(screen.getByRole("button", { name: "Annuler la demande" }));
    expect(await screen.findByText("Déjà prise en charge")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("button", { name: "Annuler" })).not.toBeInTheDocument());
  });

  it("ne propose le PDF qu'après signature", async () => {
    vi.mocked(fetchDemande).mockResolvedValue(demande("validee"));
    const first = renderPage();
    await screen.findByText("Informations du dossier");
    expect(screen.queryByRole("button", { name: /Télécharger le PDF/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Aperçu du PDF/ })).not.toBeInTheDocument();
    first.unmount();

    vi.mocked(fetchDemande).mockResolvedValue(demande("signee"));
    renderPage();
    expect(await screen.findByRole("button", { name: /Télécharger le PDF/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Aperçu du PDF/ })).toBeInTheDocument();
  });

  it("ouvre l'aperçu du PDF dans une iframe puis libère l'URL à la fermeture", async () => {
    vi.mocked(fetchDemande).mockResolvedValue(demande("archivee"));
    vi.mocked(downloadPdf).mockResolvedValue(new Blob(["%PDF"], { type: "application/pdf" }));
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: /Aperçu du PDF/ }));
    const frame = await screen.findByTitle(/Aperçu du PDF de l'acte 2026-00005/);
    expect(frame).toHaveAttribute("src", "blob:test");
    await userEvent.click(screen.getAllByRole("button", { name: "Fermer" }).at(-1) as HTMLElement);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:test");
  });

  it("affiche le message de l'API quand le PDF n'est pas disponible (404 blob)", async () => {
    vi.mocked(fetchDemande).mockResolvedValue(demande("signee"));
    const blob = new Blob([JSON.stringify({ error: { message: "PDF pas encore généré" } })]);
    vi.mocked(downloadPdf).mockRejectedValue(httpError(404, blob));
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: /Aperçu du PDF/ }));
    expect(await screen.findByText("PDF pas encore généré")).toBeInTheDocument();
  });

  it("télécharge une pièce justificative", async () => {
    vi.mocked(fetchDemande).mockResolvedValue(demande("en_instruction"));
    vi.mocked(downloadPiece).mockResolvedValue(new Blob(["x"]));
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: "Télécharger justif.pdf" }));
    await waitFor(() => expect(downloadPiece).toHaveBeenCalledWith(5, 3));
  });

  it("affiche le complément demandé sans simuler de réponse", async () => {
    vi.mocked(fetchDemande).mockResolvedValue(
      demande("en_instruction", { complement_attendu: true, complement_message: "Joignez un justificatif" }),
    );
    renderPage();
    expect(await screen.findByText("Joignez un justificatif")).toBeInTheDocument();
    expect(screen.getByText(/pas encore disponible/)).toBeInTheDocument();
  });

  it("affiche l'historique dans l'ordre chronologique avec libellés français", async () => {
    vi.mocked(fetchDemande).mockResolvedValue(demande("en_validation"));
    const rows: HistoriqueItem[] = [
      { type: "audit", action: "soumission", actor: "Maxime Leukam", message: "PR #13 ouverte", sha: null, created_at: "2026-10-12T11:00:00Z" },
      { type: "commit", action: "instruction", actor: "Maxime Leukam", message: "correction", sha: "abc1234def", created_at: "2026-10-12T10:00:00Z" },
    ];
    vi.mocked(fetchHistorique).mockResolvedValue(rows);
    renderPage();
    const first = await screen.findByText("Instruction du dossier");
    const second = screen.getByText("Soumise à validation");
    expect(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText(/commit abc1234\)/)).toBeInTheDocument();
    expect(actionLabel("nouvelle_action")).toBe("Nouvelle action");
  });

  it("gère l'historique indisponible et la demande introuvable", async () => {
    vi.mocked(fetchDemande).mockResolvedValue(demande("demandee"));
    vi.mocked(fetchHistorique).mockRejectedValue(new Error("501"));
    const first = renderPage();
    expect(await screen.findByText(/historique n'est pas disponible/)).toBeInTheDocument();
    first.unmount();

    vi.mocked(fetchDemande).mockRejectedValue(httpError(404, { error: { message: "Demande introuvable." } }));
    renderPage();
    expect(await screen.findByText("Demande introuvable")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Réessayer/ })).not.toBeInTheDocument();
  });
});
