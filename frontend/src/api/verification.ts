/**
 * API publique de vérification.
 * Propriétaire : GUEMOGNE GERALDINE ESTHER
 * Le numéro peut être saisi avec ou sans préfixe (AR, EN, AB, ACTE).
 */

import axios from "axios";

import { api, USE_MOCK } from "./client";
import { mockVerifier } from "./mock";

export interface ActeVerification {
  authentique: boolean;
  numero: string;
  type_acte: string;
  date_delivrance: string;
  statut: "signee" | "archivee";
  commune?: string;
  empreinte_sha256: string;
}

interface BackendVerification {
  valide: boolean;
  numero: string;
  type: string;
  statut: string;
  signe_le: string | null;
  signataire: string | null;
  sha256: string | null;
}

export async function verifierActe(numero: string): Promise<ActeVerification | null> {
  if (USE_MOCK) return mockVerifier(numero);
  const clean = numero.trim().toUpperCase();
  try {
    const { data } = await api.get<BackendVerification>(
      `/verification/${encodeURIComponent(clean)}`,
    );
    return {
      authentique: data.valide,
      numero: data.numero,
      type_acte: data.type,
      date_delivrance: data.signe_le ?? "",
      statut: data.statut === "archivee" ? "archivee" : "signee",
      empreinte_sha256: data.sha256 ?? "",
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null;
    throw error;
  }
}
