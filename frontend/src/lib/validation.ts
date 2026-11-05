import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Saisissez votre e-mail.").email("Adresse e-mail invalide."),
  password: z.string().min(1, "Saisissez votre mot de passe."),
  remember: z.boolean().optional(),
});
export type LoginForm = z.infer<typeof loginSchema>;

export const passwordRule = z
  .string()
  .min(8, "8 caractères minimum.")
  .regex(/[A-Z]/, "Ajoutez une majuscule.")
  .regex(/[a-z]/, "Ajoutez une minuscule.")
  .regex(/\d/, "Ajoutez un chiffre.");

export const registerSchema = z
  .object({
    nom: z.string().trim().min(2, "Saisissez votre nom."),
    prenom: z.string().trim().min(2, "Saisissez votre prénom."),
    email: z.string().min(1, "Saisissez votre e-mail.").email("Adresse e-mail invalide."),
    password: passwordRule,
    confirm: z.string().min(1, "Confirmez votre mot de passe."),
    terms: z.literal(true, { errorMap: () => ({ message: "Vous devez accepter les conditions d'utilisation." }) }),
  })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Les mots de passe ne correspondent pas." });
export type RegisterForm = z.infer<typeof registerSchema>;

export const forgotSchema = z.object({
  email: z.string().min(1, "Saisissez votre e-mail.").email("Adresse e-mail invalide."),
});
export type ForgotForm = z.infer<typeof forgotSchema>;

export const resetSchema = z
  .object({ password: passwordRule, confirm: z.string().min(1, "Confirmez votre mot de passe.") })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Les mots de passe ne correspondent pas." });
export type ResetForm = z.infer<typeof resetSchema>;

/** Numéro d'acte : ACTE-AAAA-NNNNN (ex. ACTE-2026-00042). */
export const NUMERO_REGEX = /^(?:ACTE-)?\d{4}-\d{5}$/;

export function normaliserNumero(valeur: string): string {
  return valeur.trim().toUpperCase();
}

export function numeroValide(valeur: string): boolean {
  return NUMERO_REGEX.test(normaliserNumero(valeur));
}

/** Extrait un numéro d'acte depuis le contenu d'un QR code (URL de vérification ou numéro brut). */
export function extraireNumeroDepuisQr(contenu: string): string | null {
  const m = contenu.toUpperCase().match(/ACTE-\d{4}-\d{5}|\b\d{4}-\d{5}\b/);
  return m ? m[0] : null;
}

/** Score de robustesse du mot de passe, de 0 à 4. */
export function forcePassword(p: string): number {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p) || p.length >= 12) s++;
  return s;
}

export const profileSchema = z.object({
  prenom: z.string().trim().min(2, "Saisissez votre prénom."),
  nom: z.string().trim().min(2, "Saisissez votre nom."),
});
export type ProfileForm = z.infer<typeof profileSchema>;

export const changePasswordSchema = z
  .object({ current: z.string().min(1, "Saisissez votre mot de passe actuel."), password: passwordRule, confirm: z.string().min(1, "Confirmez le nouveau mot de passe.") })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Les mots de passe ne correspondent pas." })
  .refine((d) => d.password !== d.current, { path: ["password"], message: "Le nouveau mot de passe doit être différent de l'actuel." });
export type ChangePasswordForm = z.infer<typeof changePasswordSchema>;
