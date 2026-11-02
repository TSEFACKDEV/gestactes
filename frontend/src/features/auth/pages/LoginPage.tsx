/**
 * Page de connexion.
 * Propriétaire : GUEMOGNE GERALDINE ESTHER
 * TODO :
 *  [ ] Tester les erreurs 401 et 403.
 *  [ ] Ajouter le lien mot de passe oublié.
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { getApiErrorMessage } from "@/lib/api";
import { ROLE_HOME } from "@/lib/constants";

const schema = z.object({
  email: z.string().email("Adresse e-mail invalide."),
  password: z.string().min(1, "Mot de passe requis."),
});

type LoginForm = z.infer<typeof schema>;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginForm) {
    setError(null);
    try {
      const user = await login(values.email, values.password);
      toast.success("Connexion réussie", `Bienvenue, ${user.first_name}.`);
      const next = searchParams.get("next");
      navigate(next ? decodeURIComponent(next) : ROLE_HOME[user.role], {
        replace: true,
      });
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  return (
    <AuthShell
      title="Se connecter"
      description="Accédez à votre espace pour suivre vos demandes ou instruire les actes."
      footer={
        <p>
          Pas encore de compte ?{" "}
          <Link to="/inscription" className="font-medium text-primary hover:underline">
            Créer un compte citoyen
          </Link>
        </p>
      }
    >
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
        <Input
          label="Mot de passe"
          type="password"
          autoComplete="current-password"
          placeholder="Votre mot de passe"
          error={errors.password?.message}
          required
          {...register("password")}
        />
        <div className="flex justify-end">
          <Link
            to="/mot-de-passe-oublie"
            className="text-xs font-medium text-primary hover:underline"
          >
            Mot de passe oublié ?
          </Link>
        </div>
        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Se connecter
        </Button>
      </form>
      <p className="mt-4 text-center text-xs text-ink-soft">
        Comptes de démonstration disponibles dans le README.
      </p>
    </AuthShell>
  );
}
