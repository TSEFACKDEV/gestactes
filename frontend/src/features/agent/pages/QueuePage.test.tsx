/**
 * Tests du parcours agent.
 * Propriétaire : LEUKAM TCHEUMALEU MAXIME
 * TODO :
 *  [ ] Tester la prise en charge.
 *  [ ] Tester l'enregistrement du brouillon.
 *  [ ] Tester le conflit 409.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { ToastProvider } from "@/context/ToastContext";
import { InstructionEditor } from "@/features/agent/components/InstructionEditor";
import { QueueFilters } from "@/features/agent/components/QueueFilters";

const demande = {
  id: 7,
  numero: "2026-00007",
  type: { id: 1, code: "attestation-residence", label: "Attestation de résidence" },
  demandeur: { id: 12, first_name: "Awa", last_name: "Ndiaye", role: "citoyen" },
  statut: "en_instruction",
  assigned_agent: null,
  pr_url: null,
  created_at: "2026-10-12T09:00:00Z",
  updated_at: "2026-10-12T09:00:00Z",
  donnees: { adresse: "12 rue des Lilas" },
  acte_md: "# Attestation de résidence\n\n- logement principal\n- résidence depuis 2021",
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
  pieces: [],
};

function renderWithProviders(ui: React.ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{ui}</ToastProvider>
    </QueryClientProvider>,
  );
}

describe("parcours agent", () => {
  it("affiche les filtres de date de la file d'instruction", async () => {
    const user = userEvent.setup();

    function ControlledQueueFilters() {
      const [q, setQ] = useState("");
      const [dateFrom, setDateFrom] = useState("");

      return (
        <QueueFilters
          q={q}
          onQChange={setQ}
          statut=""
          onStatutChange={() => undefined}
          dateFrom={dateFrom}
          onDateFromChange={setDateFrom}
          dateTo=""
          onDateToChange={() => undefined}
        />
      );
    }

    render(<ControlledQueueFilters />);

    const searchInput = screen.getByLabelText(/rechercher une demande/i);
    await user.type(searchInput, "2026-00007");
    expect(searchInput).toHaveValue("2026-00007");

    const dateFrom = screen.getByLabelText(/depuis le/i);
    await user.clear(dateFrom);
    await user.type(dateFrom, "2026-01-01");
    expect(dateFrom).toHaveValue("2026-01-01");
  });

  it("affiche un aperçu du contenu markdown dans l'éditeur", () => {
    renderWithProviders(<InstructionEditor demande={demande} />);

    expect(screen.getByText("Aperçu")).toBeInTheDocument();
    expect(screen.getByText("Attestation de résidence")).toBeInTheDocument();
    expect(screen.getByText("logement principal")).toBeInTheDocument();
  });
});
