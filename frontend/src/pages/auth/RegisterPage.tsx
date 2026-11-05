import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { Alert, Button, Field, IconLock, IconMail, IconUser } from "@/components/ui";
import { authApi } from "@/api/auth";
import { messageErreur } from "@/api/client";
import { forcePassword, registerSchema, RegisterForm } from "@/lib/validation";

const COULEURS = ["#c2403a", "#c2403a", "#d9a441", "#168c83", "#1e8e5a"];
const LIBELLES = ["", "Faible", "Moyen", "Bon", "Excellent"];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [erreur, setErreur] = useState<string>();
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });
  const force = forcePassword(watch("password") ?? "");

  const onSubmit = async (d: RegisterForm) => {
    setErreur(undefined);
    try {
      await authApi.register({ nom: d.nom, prenom: d.prenom, email: d.email, password: d.password });
      navigate("/connexion", { replace: true, state: { inscrit: true } });
    } catch (e) { setErreur(messageErreur(e)); }
  };

  return (
    <>
      <h1>Inscription</h1>
      <p className="auth__sub">Créez votre compte citoyen</p>
      {erreur && <Alert kind="error">{erreur}</Alert>}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field label="Nom" autoComplete="family-name" icon={<IconUser />} error={errors.nom?.message} {...register("nom")} />
        <Field label="Prénom" autoComplete="given-name" icon={<IconUser />} error={errors.prenom?.message} {...register("prenom")} />
        <Field label="Adresse e-mail" type="email" autoComplete="email" icon={<IconMail />} error={errors.email?.message} {...register("email")} />
        <Field label="Mot de passe" type="password" autoComplete="new-password" icon={<IconLock />} error={errors.password?.message} {...register("password")} />
        {force > 0 && (
          <div style={{ marginTop: "-.5rem", marginBottom: "1rem" }}>
            <div className="strength"><span style={{ width: `${force * 25}%`, background: COULEURS[force] }} /></div>
            <small style={{ color: "var(--ga-muted)" }}>Robustesse : {LIBELLES[force]}</small>
          </div>
        )}
        <Field label="Confirmer le mot de passe" type="password" autoComplete="new-password" icon={<IconLock />} error={errors.confirm?.message} {...register("confirm")} />
        <label className="check"><input type="checkbox" {...register("terms")} /> J'accepte les conditions d'utilisation</label>
        {errors.terms && <div className="field__error" role="alert" style={{ marginTop: "-.6rem", marginBottom: "1rem" }}>{errors.terms.message}</div>}
        <Button type="submit" block loading={isSubmitting}>S'inscrire</Button>
      </form>
      <p className="auth__foot">Déjà un compte ? <Link to="/connexion">Se connecter</Link></p>
    </>
  );
}
