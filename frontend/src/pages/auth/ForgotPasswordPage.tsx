import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { Alert, Button, Field, IconMail } from "@/components/ui";
import { authApi } from "@/api/auth";
import { messageErreur } from "@/api/client";
import { forgotSchema, ForgotForm } from "@/lib/validation";

export default function ForgotPasswordPage() {
  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState<string>();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotForm>({ resolver: zodResolver(forgotSchema) });

  const onSubmit = async (d: ForgotForm) => {
    setErreur(undefined);
    try { await authApi.forgotPassword(d.email); setEnvoye(true); }
    catch (e) { setErreur(messageErreur(e)); }
  };

  return (
    <>
      <h1>Mot de passe oublié ?</h1>
      <p className="auth__sub">Saisissez votre e-mail pour recevoir un lien de réinitialisation.</p>
      {envoye ? (
        // Message identique que le compte existe ou non : ne révèle pas quels e-mails sont inscrits.
        <Alert kind="success">Si un compte existe pour cette adresse, un lien vient d'être envoyé. Pensez à vérifier vos courriers indésirables.</Alert>
      ) : (
        <>
          {erreur && <Alert kind="error">{erreur}</Alert>}
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Field label="Adresse e-mail" type="email" autoComplete="email" icon={<IconMail />} error={errors.email?.message} {...register("email")} />
            <Button type="submit" block loading={isSubmitting}>Envoyer le lien</Button>
          </form>
        </>
      )}
      <p className="auth__foot"><Link to="/connexion">Retour à la connexion</Link></p>
    </>
  );
}
