/**
 * API du parcours validateur.
 * Propriétaire : METAMMO TEUMA DANIELA CLEDYA
 * TODO :
 *  [ ] Ajouter l'endpoint de comparaison de versions.
 *  [ ] Tester la signature et les conflits.
 */

import { api } from "@/lib/api";
import type {
  Demande,
  DemandeListItem,
  DecisionType,
  HistoriqueItem,
  Page,
  SignatureResult,
  Statut,
} from "@/types";

export async function fetchQueue(params?: {
  statut?: Statut;
  q?: string;
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

export async function fetchHistorique(id: number): Promise<HistoriqueItem[]> {
  const { data } = await api.get<HistoriqueItem[]>(`/demandes/${id}/historique`);
  return data;
}

export async function decide(
  id: number,
  decision: DecisionType,
  comment?: string,
): Promise<Demande> {
  const { data } = await api.post<Demande>(`/demandes/${id}/decision`, {
    decision,
    comment,
  });
  return data;
}

export async function sign(id: number): Promise<SignatureResult> {
  const { data } = await api.post<SignatureResult>(`/demandes/${id}/signature`, {
    confirmation: true,
  });
  return data;
}
