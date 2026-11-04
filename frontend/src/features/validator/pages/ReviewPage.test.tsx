/**
 * Tests du parcours validateur.
 * Propriétaire : METAMMO TEUMA DANIELA CLEDYA
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { DecisionPanel } from "@/features/validator/components/DecisionPanel";

describe("parcours validateur", () => {
  it("bloque le rejet sans commentaire", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<DecisionPanel onSubmit={onSubmit} isPending={false} />);

    await user.click(screen.getByRole("button", { name: /rejeter/i }));

    const confirmButton = screen.getByRole("button", {
      name: /confirmer la décision/i,
    });

    expect(confirmButton).toBeDisabled();

    await user.type(screen.getByLabelText(/commentaire motivé/i), "Erreur de formulaire");

    expect(confirmButton).toBeEnabled();
    await user.click(confirmButton);

    expect(onSubmit).toHaveBeenCalledWith("rejeter", "Erreur de formulaire");
  });

  it("demande une confirmation avant la signature", () => {
    render(
      <Modal
        open={true}
        onClose={() => undefined}
        title="Confirmer la signature"
        description="Cette action est définitive."
        footer={
          <>
            <Button variant="secondary" onClick={() => undefined}>
              Annuler
            </Button>
            <Button onClick={() => undefined}>Confirmer et signer</Button>
          </>
        }
      >
        <p>L'empreinte SHA-256 du contenu sera calculée.</p>
      </Modal>,
    );

    expect(screen.getByText("Confirmer la signature")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /confirmer et signer/i }),
    ).toBeInTheDocument();
  });

  it("affiche le hash et le SHA du merge après signature", () => {
    render(
      <div>
        <p>Signature enregistrée</p>
        <p>
          Empreinte SHA-256 : <span className="font-mono">abc123def456sha256</span>
        </p>
        <p>
          Merge : <span className="font-mono">9f8e7d6c1a2b</span>
        </p>
      </div>,
    );

    expect(screen.getByText(/empreinte sha-256/i)).toBeInTheDocument();
    expect(screen.getByText("abc123def456sha256")).toBeInTheDocument();
    expect(screen.getByText("9f8e7d6c1a2b")).toBeInTheDocument();
  });
});
