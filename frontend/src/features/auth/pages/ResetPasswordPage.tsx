/**
 * Page de réinitialisation du mot de passe.
 * Propriétaire : GUEMOGNE GERALDINE ESTHER
 * TODO : tester les erreurs 401/409 et le rendu mobile.
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router-dom";
import { z } from "zod";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { resetPassword } from "@/features/auth/api";
import { getApiErrorMessage } from "@/lib/api";

const schema = z
  .object({
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères."),
    confirm: z.string().min(8, "Confirmez le mot de passe."),
  })
  .refine((values) => values.password === values.confirm, {
    path: ["confirm"],
    message: "Les mots de passe ne correspondent pas.",
  });

type FormValues = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirm: "" },
  });

  async function onSubmit(values: FormValues) {
    setError(null);
    try {
      await resetPassword(token, values.password);
      setDone(true);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  return (
    <AuthShell
      title="Nouveau mot de passe"
      description="Choisissez un mot de passe solide. Toutes vos sessions ouvertes seront révoquées."
      footer={
        <Link to="/connexion" className="font-medium text-primary hover:underline">
          Retour à la connexion
        </Link>
      }
    >
      {!token ? (
        <Alert variant="danger" title="Lien incomplet">
          Ce lien ne contient pas de token valide. Recommencez la demande depuis
          la page « mot de passe oublié ».
        </Alert>
      ) : done ? (
        <Alert variant="success" title="Mot de passe modifié">
          Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
        </Alert>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {error ? <Alert variant="danger">{error}</Alert> : null}
          <Input
            label="Nouveau mot de passe"
            type="password"
            autoComplete="new-password"
            error={errors.password?.message}
            required
            {...register("password")}
          />
          <Input
            label="Confirmer le mot de passe"
            type="password"
            autoComplete="new-password"
            error={errors.confirm?.message}
            required
            {...register("confirm")}
          />
          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Enregistrer le mot de passe
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
