import { api, USE_MOCK } from "./client";
import { mockDemandes } from "./mock";
import type { Demande } from "@/lib/demande";

/**
 * Contrat avec le service Actes / Workflow (parcours citoyen) :
 *   GET /demandes        → Demande[]   (les demandes du citoyen connecté)
 *   GET /demandes/{id}   → Demande
 */
export async function listDemandes(): Promise<Demande[]> {
  if (USE_MOCK) return mockDemandes();
  return (await api.get<Demande[]>("/demandes")).data;
}

export async function getDemande(id: number): Promise<Demande | null> {
  const liste = await listDemandes();
  return liste.find((d) => d.id === id) ?? null;
}
