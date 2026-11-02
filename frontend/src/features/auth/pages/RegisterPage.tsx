/**
 * Page d'inscription citoyen.
 * Propriétaire : GUEMOGNE GERALDINE ESTHER
 * TODO :
 *  [ ] Tester le doublon d'e-mail (409).
 *  [ ] Vérifier la politique de mot de passe.
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { getApiErrorMessage } from "@/lib/api";
import { ROLE_HOME } from "@/lib/constants";

const schema = z
  .object({
    first_name: z.string().min(2, "Le prénom est requis."),
    last_name: z.string().min(2, "Le nom est requis."),
    email: z.string().email("Adresse e-mail invalide."),
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères."),
    confirm: z.string().min(8, "Confirmez le mot de passe."),
  })
  .refine((values) => values.password === values.confirm, {
    path: ["confirm"],
    message: "Les mots de passe ne correspondent pas.",
  });

type RegisterForm = z.infer<typeof schema>;

export function RegisterPage() {
  const { register: registerUser, login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      confirm: "",
    },
  });

  async function onSubmit(values: RegisterForm) {
    setError(null);
    try {
      await registerUser({
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        password: values.password,
      });
      const user = await login(values.email, values.password);
      toast.success("Compte créé", "Votre espace citoyen est prêt.");
      navigate(ROLE_HOME[user.role], { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  return (
    <AuthShell
      title="Créer un compte citoyen"
      description="Quelques informations suffisent pour déposer et suivre vos demandes d'actes."
      footer={
        <p>
          Déjà un compte ?{" "}
          <Link to="/connexion" className="font-medium text-primary hover:underline">
            Se connecter
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {error ? <Alert variant="danger">{error}</Alert> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Prénom"
            autoComplete="given-name"
            error={errors.first_name?.message}
            required
            {...register("first_name")}
          />
          <Input
            label="Nom"
            autoComplete="family-name"
            error={errors.last_name?.message}
            required
            {...register("last_name")}
          />
        </div>
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
          autoComplete="new-password"
          hint="8 caractères minimum."
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
          Créer mon compte
        </Button>
      </form>
    </AuthShell>
  );
}
