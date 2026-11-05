import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/auth/AuthContext";
import { listDemandes } from "@/api/demandes";
import { Icon, IconName, Spinner } from "@/components/ui";
import {
  compterParGroupe,
  NEXT_STEP,
  STATUT_LABEL,
  STATUT_TONE,
} from "@/lib/demande";

const Stat = ({ icon, tone, n, label }: { icon: IconName; tone: string; n: number; label: string }) => (
  <div className="stat">
    <span className={`stat__ico ${tone}`}><Icon name={icon} size={24} /></span>
    <div><strong>{n}</strong><span className="l">{label}</span></div>
  </div>
);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

const today = () =>
  new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

/** Tableau de bord citoyen simplifié. Données : GET /demandes. */
export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ["demandes"], queryFn: listDemandes });
  const c = compterParGroupe(data ?? []);
  const recentes = [...(data ?? [])]
    .sort((a, b) => +new Date(b.cree_le) - +new Date(a.cree_le))
    .slice(0, 5);
  const enCours = (data ?? []).find((d) =>
    ["demandee", "en-instruction", "en-validation", "validee"].includes(d.statut),
  );

  return (
    <>
      <div className="welcome">
        <div>
          <p className="welcome__date">{today()}</p>
          <h1>Bonjour, {user?.prenom} {user?.nom}</h1>
          <p>Voici l'état de vos démarches auprès de la commune.</p>
        </div>
        <Link className="btn btn--gold" to="/app/demandes/nouvelle">
          <Icon name="plus" size={18} /> Nouvelle demande
        </Link>
      </div>

      {isLoading ? (
        <div className="empty"><Spinner dark /></div>
      ) : (
        <>
          <div className="stats stats--three">
            <Stat icon="doc" tone="tone-gold" n={c.total} label="Demandes déposées" />
            <Stat icon="clock" tone="tone-teal" n={c.attente} label="En cours de traitement" />
            <Stat icon="check" tone="tone-green" n={c.validees} label="Actes disponibles" />
          </div>

          <div className="grid-2">
            <div className="card">
              <div className="row-between" style={{ marginBottom: "1rem" }}>
                <h2 className="sm" style={{ margin: 0 }}>Démarche en cours</h2>
                <Link to="/app/demandes">Tout voir</Link>
              </div>
              {enCours ? (
                <Link className="focus-card" to={`/app/demandes/${enCours.id}`}>
                  <strong>{enCours.type_acte}</strong>
                  <small>{enCours.numero} · déposée le {fmtDate(enCours.cree_le)}</small>
                  <span className={`badge badge--${STATUT_TONE[enCours.statut]}`}>
                    {STATUT_LABEL[enCours.statut]}
                  </span>
                  <p style={{ margin: ".7rem 0 0", fontSize: ".88rem", color: "var(--ga-muted)" }}>
                    {NEXT_STEP[enCours.statut]}
                  </p>
                </Link>
              ) : (
                <div className="empty" style={{ padding: "1.5rem 0" }}>
                  <Icon name="doc" size={32} />
                  <p>Aucune démarche en cours.</p>
                  <Link className="btn btn--gold btn--sm" to="/app/demandes/nouvelle">
                    Déposer une demande
                  </Link>
                </div>
              )}
            </div>

            <div className="card">
              <h2 className="sm">Démarches fréquentes</h2>
              <div className="quick-links">
                <Link to="/app/demandes/nouvelle?type=attestation-residence">
                  Attestation de résidence <span>Justificatif de domicile</span>
                </Link>
                <Link to="/app/demandes/nouvelle?type=extrait-naissance">
                  Extrait d'acte de naissance <span>État civil</span>
                </Link>
                <Link to="/app/demandes/nouvelle?type=autorisation-batir">
                  Autorisation de bâtir <span>Urbanisme</span>
                </Link>
                <Link to="/verifier">
                  Vérifier un acte <span>Numéro ou QR code</span>
                </Link>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: "1.25rem" }}>
            <div className="row-between" style={{ marginBottom: "1rem" }}>
              <h2 className="sm" style={{ margin: 0 }}>Dernières demandes</h2>
              <Link to="/app/demandes">Tout voir</Link>
            </div>
            {recentes.length === 0 ? (
              <div className="empty" style={{ padding: "1rem 0" }}>
                <p>Vous n'avez pas encore déposé de demande.</p>
              </div>
            ) : (
              <div className="list">
                {recentes.map((d) => (
                  <Link key={d.id} className="row-card" to={`/app/demandes/${d.id}`}>
                    <span className="row-card__ico"><Icon name="doc" /></span>
                    <span className="row-card__main">
                      <strong>{d.type_acte}</strong>
                      <small>{d.numero} · {fmtDate(d.cree_le)}</small>
                    </span>
                    <span className={`badge badge--${STATUT_TONE[d.statut]}`}>
                      {STATUT_LABEL[d.statut]}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
