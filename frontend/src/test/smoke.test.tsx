/**
 * Test de fumée du design system.
 * Propriétaire : VOUMIA OUALA DILANE
 * TODO :
 *  [ ] Ajouter les tests d'accessibilité.
 *  [ ] Tester les composants critiques (formulaires, modales).
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";

describe("design system", () => {
  it("affiche un bouton avec son libellé", () => {
    render(<Button>Enregistrer</Button>);
    expect(screen.getByRole("button", { name: "Enregistrer" })).toBeInTheDocument();
  });

  it("affiche le libellé d'un statut", () => {
    render(<StatusBadge statut="en_validation" />);
    expect(screen.getByText("En validation")).toBeInTheDocument();
  });
});
