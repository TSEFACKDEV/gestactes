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
  const from = (useLocation().state as { from?: string } | null)?.from;
  const [erreur, setErreur] = useState<string>();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (d: LoginForm) => {
    setErreur(undefined);
    try {
      const user = await login(d.email, d.password, !!d.remember);
      navigate(from ?? HOME_BY_ROLE[user.role], { replace: true });
    } catch (e) { setErreur(messageErreur(e)); }
  };

  return (
    <>
      <h1>Connexion</h1>
      <p className="auth__sub">Accédez à votre compte</p>
      {erreur && <Alert kind="error">{erreur}</Alert>}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field label="Adresse e-mail" type="email" autoComplete="email" icon={<IconMail />} error={errors.email?.message} {...register("email")} />
        <Field label="Mot de passe" type="password" autoComplete="current-password" icon={<IconLock />} error={errors.password?.message} {...register("password")} />
        <div className="row-between" style={{ marginBottom: "1rem" }}>
          <label className="check" style={{ margin: 0 }}><input type="checkbox" {...register("remember")} /> Se souvenir de moi</label>
          <Link to="/mot-de-passe-oublie">Mot de passe oublié ?</Link>
        </div>
        <Button type="submit" block loading={isSubmitting}>Se connecter</Button>
      </form>
      <div className="divider">ou</div>
      <p className="auth__foot"><Link to="/inscription">Créer un compte</Link></p>
    </>
  );
}
