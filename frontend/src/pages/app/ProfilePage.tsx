import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Alert, Button, Field, Icon, IconName } from "@/components/ui";
import { useAuth } from "@/auth/AuthContext";
import { authApi } from "@/api/auth";
import { messageErreur } from "@/api/client";
import { listDemandes } from "@/api/demandes";
import { DROITS_BY_ROLE, ROLE_LABEL } from "@/lib/roles";
import { changePasswordSchema, ChangePasswordForm, forcePassword, profileSchema, ProfileForm } from "@/lib/validation";
import { ThemeMode, useTheme } from "@/theme/ThemeProvider";

type Onglet = "infos" | "securite" | "apparence" | "notifications";
const ONGLETS: { id: Onglet; label: string; icon: IconName }[] = [
  { id: "infos", label: "Informations", icon: "user" },
  { id: "securite", label: "Sécurité", icon: "lock" },
  { id: "apparence", label: "Apparence", icon: "sun" },
  { id: "notifications", label: "Notifications", icon: "bell" },
];

/* ---------------- Informations personnelles ---------------- */
function Infos() {
  const { user, updateUser } = useAuth();
  const [ok, setOk] = useState(false);
  const [erreur, setErreur] = useState<string>();
  const { data } = useQuery({ queryKey: ["demandes"], queryFn: listDemandes, enabled: user?.role === "citoyen" });
  const { register, handleSubmit, formState: { errors, isSubmitting, isDirty }, reset } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema), defaultValues: { prenom: user?.prenom, nom: user?.nom },
  });
  if (!user) return null;

  const onSubmit = async (d: ProfileForm) => {
    setErreur(undefined); setOk(false);
    try { const u = await authApi.updateProfile(d); updateUser(u); reset({ prenom: u.prenom, nom: u.nom }); setOk(true); }
    catch (e) { setErreur(messageErreur(e)); }
  };

  return (
    <div className="card panel">
      <h2>Informations personnelles</h2>
      <p className="lead">Ces informations apparaissent sur vos demandes et dans l'historique des actes.</p>
      {ok && <Alert kind="success">Profil mis à jour.</Alert>}
      {erreur && <Alert kind="error">{erreur}</Alert>}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="form-grid">
          <Field label="Prénom" autoComplete="given-name" icon={<Icon name="user" />} error={errors.prenom?.message} {...register("prenom")} />
          <Field label="Nom" autoComplete="family-name" icon={<Icon name="user" />} error={errors.nom?.message} {...register("nom")} />
        </div>
        <Field label="Adresse e-mail" value={user.email} readOnly icon={<Icon name="mail" />} />
        <p className="hint">L'adresse e-mail identifie votre compte et reçoit les notifications. Pour la modifier, contactez l'administrateur.</p>
        <Button type="submit" loading={isSubmitting} disabled={!isDirty}>Enregistrer les modifications</Button>
      </form>

      <hr className="sep" />
      <h2 style={{ fontSize: "1.05rem" }}>Mon compte</h2>
      <dl className="info-grid" style={{ margin: "1rem 0 1.5rem" }}>
        <div><dt>Rôle</dt><dd>{ROLE_LABEL[user.role]}</dd></div>
        <div><dt>Statut du compte</dt><dd><span className="badge badge--success">{user.actif ? "Actif" : "Désactivé"}</span></dd></div>
        <div><dt>Identifiant</dt><dd>#{String(user.id).padStart(5, "0")}</dd></div>
        {user.role === "citoyen" && <div><dt>Demandes déposées</dt><dd>{data ? data.length : "…"}</dd></div>}
      </dl>
      <h3 style={{ fontSize: ".95rem" }}>Ce que votre rôle vous permet</h3>
      <ul className="perm">{DROITS_BY_ROLE[user.role].map((d) => <li key={d}><Icon name="check" size={18} />{d}</li>)}</ul>
    </div>
  );
}

/* ---------------- Sécurité ---------------- */
const COULEURS = ["#c2403a", "#c2403a", "#d9a441", "#168c83", "#1e8e5a"];
const LIBELLES = ["", "Faible", "Moyen", "Bon", "Excellent"];

function Securite() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [ok, setOk] = useState(false);
  const [erreur, setErreur] = useState<string>();
  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm<ChangePasswordForm>({ resolver: zodResolver(changePasswordSchema) });
  const force = forcePassword(watch("password") ?? "");

  const onSubmit = async (d: ChangePasswordForm) => {
    setErreur(undefined); setOk(false);
    try { await authApi.changePassword(d.current, d.password); reset(); setOk(true); }
    catch (e) { setErreur(messageErreur(e)); }
  };

  return (
    <div className="card panel">
      <h2>Mot de passe</h2>
      <p className="lead">Choisissez un mot de passe robuste que vous n'utilisez nulle part ailleurs.</p>
      {ok && <Alert kind="success">Mot de passe modifié avec succès.</Alert>}
      {erreur && <Alert kind="error">{erreur}</Alert>}
      <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ maxWidth: 440 }}>
        <Field label="Mot de passe actuel" type="password" autoComplete="current-password" icon={<Icon name="lock" />} error={errors.current?.message} {...register("current")} />
        <Field label="Nouveau mot de passe" type="password" autoComplete="new-password" icon={<Icon name="key" />} error={errors.password?.message} {...register("password")} />
        {force > 0 && (
          <div style={{ marginTop: "-.5rem", marginBottom: "1rem" }}>
            <div className="strength"><span style={{ width: `${force * 25}%`, background: COULEURS[force] }} /></div>
            <small style={{ color: "var(--ga-muted)" }}>Robustesse : {LIBELLES[force]}</small>
          </div>
        )}
        <Field label="Confirmer le nouveau mot de passe" type="password" autoComplete="new-password" icon={<Icon name="key" />} error={errors.confirm?.message} {...register("confirm")} />
        <Button type="submit" loading={isSubmitting}>Changer le mot de passe</Button>
      </form>

      <hr className="sep" />
      <h2 style={{ fontSize: "1.05rem" }}>Session</h2>
      <p className="lead" style={{ marginBottom: "1rem" }}>Pour votre sécurité, la session expire après 30 minutes d'inactivité et se renouvelle automatiquement pendant l'utilisation.</p>
      <div className="danger-zone">
        <div><strong>Se déconnecter de cet appareil</strong><small>Vous devrez saisir à nouveau vos identifiants.</small></div>
        <Button variant="ghost" onClick={() => { logout(); navigate("/connexion"); }}><Icon name="logout" size={18} /> Se déconnecter</Button>
      </div>
    </div>
  );
}

/* ---------------- Apparence ---------------- */
function Apparence() {
  const { mode, setMode } = useTheme();
  const opts: { id: ThemeMode; label: string; desc: string }[] = [
    { id: "light", label: "Clair", desc: "Fond lumineux" },
    { id: "dark", label: "Sombre", desc: "Repose les yeux le soir" },
    { id: "system", label: "Système", desc: "Suit votre appareil" },
  ];
  return (
    <div className="card panel">
      <h2>Apparence</h2>
      <p className="lead">Choisissez le thème de l'interface. Votre choix est mémorisé sur cet appareil.</p>
      <div className="theme-opts" role="radiogroup" aria-label="Thème de l'interface">
        {opts.map((o) => (
          <button key={o.id} type="button" role="radio" aria-checked={mode === o.id} className="theme-opt" onClick={() => setMode(o.id)}>
            <div className={`prev prev--${o.id}`} aria-hidden="true"><i /><b /></div>
            {o.label}<small>{o.desc}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Notifications ---------------- */
const NKEY = "gestactes.notifs";
function Notifications() {
  const [prefs, setPrefs] = useState<{ email: boolean; interne: boolean }>(() => {
    try { return { email: true, interne: true, ...JSON.parse(localStorage.getItem(NKEY) ?? "{}") }; } catch { return { email: true, interne: true }; }
  });
  useEffect(() => { try { localStorage.setItem(NKEY, JSON.stringify(prefs)); } catch { /* ignoré */ } }, [prefs]);
  const Row = ({ k, titre, desc }: { k: "email" | "interne"; titre: string; desc: string }) => (
    <div className="switch-row">
      <div><strong>{titre}</strong><small>{desc}</small></div>
      <button type="button" role="switch" className="switch" aria-checked={prefs[k]} aria-label={titre} onClick={() => setPrefs((p) => ({ ...p, [k]: !p[k] }))} />
    </div>
  );
  return (
    <div className="card panel">
      <h2>Notifications</h2>
      <p className="lead">Soyez prévenu à chaque changement d'état de vos demandes : prise en charge, complément demandé, rejet, signature.</p>
      <Row k="email" titre="Notifications par e-mail" desc="Un e-mail à chaque changement d'état." />
      <Row k="interne" titre="Notifications dans l'application" desc="La cloche de l'en-tête affiche les nouveautés." />
      <p className="hint" style={{ margin: "1rem 0 0" }}>Préférences enregistrées sur cet appareil ; elles seront synchronisées avec votre compte lorsque le service Notification les exposera.</p>
    </div>
  );
}

/* ---------------- Page ---------------- */
export default function ProfilePage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const demande = params.get("onglet") as Onglet | null;
  const onglet: Onglet = ONGLETS.some((o) => o.id === demande) ? (demande as Onglet) : "infos";
  if (!user) return null;
  const initiales = `${user.prenom[0] ?? ""}${user.nom[0] ?? ""}`.toUpperCase();

  return (
    <>
      <section className="profile-hero" aria-label="Résumé du profil">
        <img src="/images/hotel-de-ville-800.webp" alt="" width={800} height={1067} decoding="async" />
        <div className="avatar avatar--lg" aria-hidden="true">{initiales}</div>
        <div>
          <h1>{user.prenom} {user.nom}</h1>
          <div className="meta">
            <span className="pill">{ROLE_LABEL[user.role]}</span>
            <span className="pill pill--ok">Compte {user.actif ? "actif" : "désactivé"}</span>
            <span style={{ display: "inline-flex", gap: ".4rem", alignItems: "center" }}><Icon name="mail" size={16} />{user.email}</span>
          </div>
        </div>
      </section>

      <div className="profile-layout">
        <div className="ptabs" role="tablist" aria-label="Paramètres du profil" aria-orientation="vertical">
          {ONGLETS.map((o) => (
            <button key={o.id} role="tab" aria-selected={onglet === o.id} onClick={() => setParams(o.id === "infos" ? {} : { onglet: o.id }, { replace: true })}>
              <Icon name={o.icon} size={18} />{o.label}
            </button>
          ))}
        </div>
        <div role="tabpanel">
          {onglet === "infos" && <Infos />}
          {onglet === "securite" && <Securite />}
          {onglet === "apparence" && <Apparence />}
          {onglet === "notifications" && <Notifications />}
        </div>
      </div>
    </>
  );
}
