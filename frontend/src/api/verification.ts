import axios from "axios";
import { api, USE_MOCK } from "./client";
import { mockVerifier } from "./mock";

/** Réponse publique de GET /verification/{numero} : volontairement sans donnée personnelle (EF-21). */
export interface ActeVerification {
  authentique: boolean;
  numero: string;
  type_acte: string;
  date_delivrance: string; // ISO 8601
  statut: "signee" | "archivee";
  commune?: string;
  empreinte_sha256: string;
}

/** Retourne l'acte, ou null si le numéro est inconnu (404). */
export async function verifierActe(numero: string): Promise<ActeVerification | null> {
  try {
    if (USE_MOCK) return await mockVerifier(numero);
    return (await api.get<ActeVerification>(`/verification/${encodeURIComponent(numero)}`)).data;
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.status === 404) return null;
    if ((e as { notFound?: boolean }).notFound) return null;
    throw e;
  }
}
