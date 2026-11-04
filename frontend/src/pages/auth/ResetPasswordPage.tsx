import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useSearchParams } from "react-router-dom";
import { Alert, Button, Field, IconLock } from "@/components/ui";
import { authApi } from "@/api/auth";
import { messageErreur } from "@/api/client";
import { resetSchema, ResetForm } from "@/lib/validation";

export default function ResetPasswordPage() {
  const token = useSearchParams()[0].get("token");
  const [ok, setOk] = useState(false);
  const [erreur, setErreur] = useState<string>();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetForm>({ resolver: zodResolver(resetSchema) });

  if (!token) return (<><h1>Lien invalide</h1><Alert kind="error">Ce lien de réinitialisation est incomplet. Demandez-en un nouveau.</Alert><Link className="btn btn--gold btn--block" to="/mot-de-passe-oublie">Demander un nouveau lien</Link></>);

  const onSubmit = async (d: ResetForm) => {
    setErreur(undefined);
    try { await authApi.resetPassword(token, d.password); setOk(true); }
    catch (e) { setErreur(messageErreur(e, "Le lien a expiré. Demandez-en un nouveau.")); }
  };

  return (
    <>
      <h1>Nouveau mot de passe</h1>
      <p className="auth__sub">Choisissez un mot de passe robuste.</p>
      {ok ? (
        <><Alert kind="success">Mot de passe modifié. Vous pouvez vous connecter.</Alert><Link className="btn btn--gold btn--block" to="/connexion">Se connecter</Link></>
      ) : (
        <>
          {erreur && <Alert kind="error">{erreur}</Alert>}
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Field label="Nouveau mot de passe" type="password" autoComplete="new-password" icon={<IconLock />} error={errors.password?.message} {...register("password")} />
            <Field label="Confirmer le mot de passe" type="password" autoComplete="new-password" icon={<IconLock />} error={errors.confirm?.message} {...register("confirm")} />
            <Button type="submit" block loading={isSubmitting}>Enregistrer</Button>
          </form>
        </>
      )}
    </>
  );
}
