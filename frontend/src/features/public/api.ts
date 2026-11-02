/**
 * API publique de vérification.
 * Propriétaire : GUEMOGNE GERALDINE ESTHER
 * TODO : tester la vérification publique et le rendu mobile.
 */

import { api } from "@/lib/api";
import type { Verification } from "@/types";

export async function verifyActe(numero: string): Promise<Verification> {
  const { data } = await api.get<Verification>(
    `/verification/${encodeURIComponent(numero)}`,
  );
  return data;
}
