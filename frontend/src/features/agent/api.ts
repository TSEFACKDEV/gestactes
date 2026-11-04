/**
 * API du parcours agent.
 * Propriétaire : LEUKAM TCHEUMALEU MAXIME
 * TODO :
 *  [ ] Tester les transitions et les erreurs 409.
 */

import { api } from "@/lib/api";
import type {
  Demande,
  DemandeListItem,
  HistoriqueItem,
  Page,
  Statut,
} from "@/types";

export async function fetchQueue(params?: {
  statut?: Statut;
  q?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}): Promise<Page<DemandeListItem>> {
  const { data } = await api.get<Page<DemandeListItem>>("/demandes", { params });
  return data;
}

export async function fetchDemande(id: number): Promise<Demande> {
  const { data } = await api.get<Demande>(`/demandes/${id}`);
  return data;
}

export async function takeCharge(id: number): Promise<Demande> {
  const { data } = await api.post<Demande>(`/demandes/${id}/prise-en-charge`);
  return data;
}

export async function updateContent(
  id: number,
  payload: {
    donnees?: Record<string, unknown>;
    acte_md?: string;
    message?: string;
  },
): Promise<Demande> {
  const { data } = await api.put<Demande>(`/demandes/${id}/contenu`, payload);
  return data;
}

export async function requestComplement(
  id: number,
  message: string,
): Promise<Demande> {
  const { data } = await api.post<Demande>(`/demandes/${id}/complement`, {
    message,
  });
  return data;
}

export async function submitDemande(
  id: number,
  comment?: string,
): Promise<Demande> {
  const { data } = await api.post<Demande>(`/demandes/${id}/soumission`, {
    comment,
  });
  return data;
}

export async function fetchHistorique(id: number): Promise<HistoriqueItem[]> {
  const { data } = await api.get<HistoriqueItem[]>(`/demandes/${id}/historique`);
  return data;
}
