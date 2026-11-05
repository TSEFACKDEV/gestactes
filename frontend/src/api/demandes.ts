/**
 * API des demandes côté citoyen.
 * Propriétaire : JEUDIEU TSAGUE AUDREY DANIELLE
 * TODO : brancher les actions d'annulation et de téléchargement.
 */

import { api, USE_MOCK } from "./client";
import { mockDemandes } from "./mock";
import type { Demande, Statut } from "@/lib/demande";
import type { Page, Statut as BackendStatut } from "@/types";

interface BackendDemande {
  id: number;
  numero: string;
  type: { label: string };
  statut: BackendStatut;
  created_at: string;
}

function toFrontendStatut(statut: BackendStatut): Statut {
  return statut.replaceAll("_", "-") as Statut;
}

function mapDemande(demande: BackendDemande): Demande {
  return {
    id: demande.id,
    numero: demande.numero,
    type_acte: demande.type.label,
    statut: toFrontendStatut(demande.statut),
    cree_le: demande.created_at,
  };
}

export async function listDemandes(): Promise<Demande[]> {
  if (USE_MOCK) return mockDemandes();
  const { data } = await api.get<Page<BackendDemande>>("/demandes", {
    params: { page: 1, page_size: 100 },
  });
  return data.items.map(mapDemande);
}

export async function getDemande(id: number): Promise<Demande | null> {
  if (USE_MOCK) {
    const liste = await mockDemandes();
    return liste.find((demande) => demande.id === id) ?? null;
  }
  try {
    const { data } = await api.get<BackendDemande>(`/demandes/${id}`);
    return mapDemande(data);
  } catch {
    return null;
  }
}
