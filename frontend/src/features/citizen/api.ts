/**
 * API du parcours citoyen.
 * Propriétaire : JEUDIEU TSAGUE AUDREY DANIELLE
 * TODO :
 *  [ ] Ajouter l'upload multipart avec progression.
 *  [ ] Tester les erreurs 413 et 422.
 */

import { api } from "@/lib/api";
import type {
  Demande,
  DemandeCreatePayload,
  DemandeListItem,
  HistoriqueItem,
  Page,
  Statut,
  TypeActe,
} from "@/types";

export async function fetchTypes(): Promise<TypeActe[]> {
  const { data } = await api.get<TypeActe[]>("/types-actes");
  return data;
}

export async function fetchDemandes(params?: {
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

export async function createDemande(
  payload: DemandeCreatePayload,
  files: File[],
): Promise<Demande> {
  const form = new FormData();
  form.append("payload", JSON.stringify(payload));
  files.forEach((file) => form.append("files", file));
  const { data } = await api.post<Demande>("/demandes", form);
  return data;
}

export async function cancelDemande(id: number): Promise<Demande> {
  const { data } = await api.post<Demande>(`/demandes/${id}/annulation`);
  return data;
}

export async function fetchHistorique(id: number): Promise<HistoriqueItem[]> {
  const { data } = await api.get<HistoriqueItem[]>(`/demandes/${id}/historique`);
  return data;
}

export async function downloadPdf(id: number): Promise<Blob> {
  const { data } = await api.get<Blob>(`/demandes/${id}/pdf`, {
    responseType: "blob",
  });
  return data;
}

/** `GET /demandes/{id}/pieces/{piece_id}` : le fichier avec son Content-Type. */
export async function downloadPiece(id: number, pieceId: number): Promise<Blob> {
  const { data } = await api.get<Blob>(`/demandes/${id}/pieces/${pieceId}`, {
    responseType: "blob",
  });
  return data;
}
