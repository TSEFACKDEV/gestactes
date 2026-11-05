import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Alert, Button, Field, IconLock, IconMail } from "@/components/ui";
import { useAuth } from "@/auth/AuthContext";
import { messageErreur } from "@/api/client";
import { HOME_BY_ROLE } from "@/lib/roles";
import { loginSchema, LoginForm } from "@/lib/validation";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const state = useLocation().state as { from?: string; inscrit?: boolean } | null;
  const from = state?.from;
  const [erreur, setErreur] = useState<string>();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (d: LoginForm) => {
    setErreur(undefined);
    try {
      const user = await login(d.email, d.password);
      navigate(from ?? HOME_BY_ROLE[user.role], { replace: true });
    } catch (e) { setErreur(messageErreur(e)); }
  };

  return (
    <>
      <h1>Connexion</h1>
      <p className="auth__sub">Accédez à votre compte</p>
      {state?.inscrit && <Alert kind="success">Compte créé. Connectez-vous pour continuer.</Alert>}
      {erreur && <Alert kind="error">{erreur}</Alert>}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field label="Adresse e-mail" type="email" autoComplete="email" icon={<IconMail />} error={errors.email?.message} {...register("email")} />
        <Field label="Mot de passe" type="password" autoComplete="current-password" icon={<IconLock />} error={errors.password?.message} {...register("password")} />
        <div className="row-between" style={{ marginBottom: "1rem", justifyContent: "flex-end" }}>
          <Link to="/mot-de-passe-oublie">Mot de passe oublié ?</Link>
        </div>
        <Button type="submit" block loading={isSubmitting}>Se connecter</Button>
      </form>
      <div className="divider">ou</div>
      <Link className="btn btn--ghost btn--block" to="/inscription">Créer un compte</Link>
    </>
  );
}
