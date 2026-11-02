/**
 * API du parcours d'authentification.
 * Propriétaire : GUEMOGNE GERALDINE ESTHER
 * TODO :
 *  [ ] Ajouter la gestion du changement de mot de passe.
 */

import { api } from "@/lib/api";

export async function forgotPassword(email: string): Promise<void> {
  await api.post("/auth/forgot-password", { email });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await api.post("/auth/reset-password", {
    token,
    new_password: newPassword,
  });
}
