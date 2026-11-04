/**
 * API du parcours citoyen.
 * Propriétaire : JEUDIEU TSAGUE AUDREY DANIELLE
 *
 * Partagé entre les pages citoyennes : ne jamais supprimer ni renommer une
 * fonction exportée, seulement en ajouter ou l'étendre de façon compatible.
 */

import axios from "axios";

import { api, getApiErrorDetails, getApiErrorMessage } from "@/lib/api";
import { MAX_FILE_SIZE_MB } from "@/lib/constants";
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

export interface CreateDemandeOptions {
  /** Rejouer la même clé retourne la demande déjà créée (contrat API). */
  idempotencyKey?: string;
  /** Progression de l'envoi, de 0 à 100. */
  onProgress?: (percent: number) => void;
}

/** Génère une clé d'idempotence, y compris hors contexte sécurisé. */
export function createIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/** `POST /demandes` en multipart : `payload` (JSON) + `files` (0 à 3 pièces). */
export async function createDemande(
  payload: DemandeCreatePayload,
  files: File[],
  options: CreateDemandeOptions = {},
): Promise<Demande> {
  const form = new FormData();
  form.append("payload", JSON.stringify(payload));
  files.forEach((file) => form.append("files", file));
  const { data } = await api.post<Demande>("/demandes", form, {
    headers: options.idempotencyKey
      ? { "Idempotency-Key": options.idempotencyKey }
      : undefined,
    // Un envoi de pièces peut dépasser le délai par défaut de 15 s.
    timeout: 60_000,
    onUploadProgress: options.onProgress
      ? (event) => {
          if (event.total) {
            options.onProgress?.(Math.min(100, Math.round((event.loaded / event.total) * 100)));
          }
        }
      : undefined,
  });
  return data;
}

export interface CreateDemandeFailure {
  status: number | null;
  /** Message principal, rédigé pour l'utilisateur. */
  message: string;
  /** Détails 422 par champ (`details` du contrat d'erreur). */
  details: Record<string, string>;
}

/** Traduit une erreur de `createDemande` (413, 422, réseau…) pour l'affichage. */
export function interpretCreateError(error: unknown): CreateDemandeFailure {
  if (!axios.isAxiosError(error)) {
    return { status: null, message: getApiErrorMessage(error), details: {} };
  }
  const status = error.response?.status ?? null;
  const details = getApiErrorDetails(error);

  if (status === null) {
    return {
      status,
      message:
        "Le serveur est injoignable. Vérifiez votre connexion puis réessayez : votre saisie est conservée.",
      details,
    };
  }
  if (status === 413) {
    return {
      status,
      message: `Une pièce jointe dépasse la taille maximale de ${MAX_FILE_SIZE_MB} Mo. Réduisez-la ou remplacez-la, puis réessayez.`,
      details,
    };
  }
  if (status === 422) {
    return {
      status,
      message:
        error.response?.data?.error?.message ??
        "Certaines informations sont invalides. Corrigez les champs signalés puis réessayez.",
      details,
    };
  }
  if (status === 429) {
    return {
      status,
      message: "Trop de tentatives en peu de temps. Patientez un instant avant de réessayer.",
      details,
    };
  }
  return { status, message: getApiErrorMessage(error), details };
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
