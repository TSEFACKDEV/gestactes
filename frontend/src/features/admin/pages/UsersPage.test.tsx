/**
 * Tests de l'administration.
 * Propriétaire : NZEUTEM DOMOE EUNICE FELIXTINE
 * TODO :
 *  [ ] Tester la création d'un agent.
 *  [ ] Tester la protection du dernier admin.
 *  [ ] Tester la validation JSON d'un type d'acte.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TypeFormModal } from "@/features/admin/components/TypeFormModal";

describe("administration", () => {
  it("prévisualise et soumet un schéma de formulaire valide", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <TypeFormModal open onClose={vi.fn()} onSubmit={onSubmit} isPending={false} />,
    );

    await user.type(screen.getByPlaceholderText("attestation-residence"), "attestation");
    await user.type(
      screen.getByPlaceholderText("Attestation de résidence"),
      "Attestation",
    );
    fireEvent.change(screen.getByLabelText("Schéma du formulaire (JSON)"), {
      target: {
        value: '[{"name":"adresse","label":"Adresse","type":"text"}]',
      },
    });

    expect(
      screen.getByRole("region", { name: "Aperçu du formulaire" }),
    ).toHaveTextContent("Adresse");
    await user.click(screen.getByRole("button", { name: "Créer le type" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        form_schema: [
          { name: "adresse", label: "Adresse", type: "text", required: true },
        ],
      }),
    );
  });

  it("refuse un schéma JSON dont les champs sont invalides", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <TypeFormModal open onClose={vi.fn()} onSubmit={onSubmit} isPending={false} />,
    );

    await user.type(screen.getByPlaceholderText("attestation-residence"), "attestation");
    await user.type(
      screen.getByPlaceholderText("Attestation de résidence"),
      "Attestation",
    );
    fireEvent.change(screen.getByLabelText("Schéma du formulaire (JSON)"), {
      target: { value: "[{}]" },
    });
    await user.click(screen.getByRole("button", { name: "Créer le type" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/champ|schéma/i);
  });
});
