/**
 * Page « mot de passe oublié ».
 * Propriétaire : GUEMOGNE GERALDINE ESTHER
 * TODO : tester les erreurs 401/409 et le rendu mobile.
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { forgotPassword } from "@/features/auth/api";
import { getApiErrorMessage } from "@/lib/api";

const schema = z.object({
  email: z.string().email("Adresse e-mail invalide."),
});

type FormValues = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: FormValues) {
    setError(null);
    try {
      await forgotPassword(values.email);
      setSent(true);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  return (
    <AuthShell
      title="Mot de passe oublié"
      description="Indiquez votre adresse e-mail. Si un compte existe, un lien de réinitialisation sera envoyé."
      footer={
        <Link to="/connexion" className="font-medium text-primary hover:underline">
          Retour à la connexion
        </Link>
      }
    >
      {sent ? (
        <Alert variant="success" title="Demande envoyée">
          Consultez votre boîte de réception. Le lien de réinitialisation est
          valable 30 minutes.
        </Alert>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {error ? <Alert variant="danger">{error}</Alert> : null}
          <Input
            label="Adresse e-mail"
            type="email"
            autoComplete="email"
            placeholder="vous@exemple.com"
            error={errors.email?.message}
            required
            {...register("email")}
          />
          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Envoyer le lien
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
