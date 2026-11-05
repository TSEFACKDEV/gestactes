import { describe, expect, it } from "vitest";
import { compterParGroupe, serieDepots, Demande } from "./demande";

const jour = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
const d = (statut: Demande["statut"], age: number): Demande => ({ id: age, numero: "ACTE-2026-00001", type_acte: "x", statut, cree_le: jour(age) });

describe("demandes", () => {
  it("compte par groupe", () => {
    const c = compterParGroupe([d("demandee", 1), d("en-validation", 2), d("signee", 3), d("rejetee", 4), d("annulee", 5)]);
    expect(c).toEqual({ total: 5, attente: 2, validees: 1, rejetees: 2 });
  });
  it("répartit les dépôts par tranche de 5 jours (ancien → récent)", () => {
    expect(serieDepots([d("signee", 1), d("signee", 2), d("signee", 29), d("signee", 40)])).toEqual([1, 0, 0, 0, 0, 2]);
  });
});
