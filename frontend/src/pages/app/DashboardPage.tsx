import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/auth/AuthContext";
import { listDemandes } from "@/api/demandes";
import { Icon, IconName, Spinner } from "@/components/ui";
import { compterParGroupe, serieDepots, STATUT_LABEL, STATUT_TONE } from "@/lib/demande";

function Courbe({ valeurs }: { valeurs: number[] }) {
  const W = 520, H = 200, px = 34, py = 24;
  const max = Math.max(4, ...valeurs);
  const x = (i: number) => px + (i * (W - 2 * px)) / (valeurs.length - 1);
  const y = (v: number) => H - py - (v * (H - 2 * py)) / max;
  const pts = valeurs.map((v, i) => `${x(i)},${y(v)}`);
  const labels = ["-30 j", "-25 j", "-20 j", "-15 j", "-10 j", "-5 j"];
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Demandes déposées sur les 30 derniers jours : ${valeurs.join(", ")} par tranche de 5 jours`}>
      {[0, 1, 2, 3, 4].map((g) => { const v = Math.round((g * max) / 4); return <g key={g}><line x1={px} x2={W - px} y1={y(v)} y2={y(v)} style={{ stroke: "var(--ga-border)" }} /><text x={px - 8} y={y(v) + 4} fontSize="11" textAnchor="end" style={{ fill: "var(--ga-muted)" }}>{v}</text></g>; })}
      <polygon points={`${x(0)},${y(0)} ${pts.join(" ")} ${x(valeurs.length - 1)},${y(0)}`} fill="#168c83" opacity=".12" />
      <polyline points={pts.join(" ")} fill="none" stroke="#168c83" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {valeurs.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="4.5" style={{ fill: "var(--ga-surface)" }} stroke="#168c83" strokeWidth="2.5" />)}
      {labels.map((l, i) => <text key={l} x={x(i)} y={H - 4} fontSize="11" textAnchor="middle" style={{ fill: "var(--ga-muted)" }}>{l}</text>)}
    </svg>
  );
}

const Stat = ({ icon, tone, n, label }: { icon: IconName; tone: string; n: number; label: string }) => (
  <div className="stat"><span className={`stat__ico ${tone}`}><Icon name={icon} size={24} /></span><div><strong>{n}</strong><span className="l">{label}</span></div></div>
);

/** Tableau de bord citoyen (maquette « Espace principal »). Données : GET /demandes. */
export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ["demandes"], queryFn: listDemandes });
  const c = compterParGroupe(data ?? []);
  const recentes = [...(data ?? [])].sort((a, b) => +new Date(b.cree_le) - +new Date(a.cree_le)).slice(0, 4);

  return (
    <>
      <div className="welcome"><h1>Bonjour, {user?.prenom} {user?.nom}</h1><p>Bienvenue sur GestActes.</p></div>
      {isLoading ? <div className="empty"><Spinner dark /></div> : (
        <>
          <div className="stats">
            <Stat icon="doc" tone="tone-gold" n={c.total} label="Demandes" />
            <Stat icon="check" tone="tone-green" n={c.validees} label="Validées" />
            <Stat icon="clock" tone="tone-teal" n={c.attente} label="En attente" />
            <Stat icon="cross" tone="tone-red" n={c.rejetees} label="Rejetées" />
          </div>
          <div className="grid-2">
            <div className="card"><h2 className="sm">Mes demandes (30 derniers jours)</h2><Courbe valeurs={serieDepots(data ?? [])} /></div>
            <div className="card">
              <h2 className="sm">Actions rapides</h2>
              <div className="stack">
                <Link className="btn btn--gold btn--block" to="/app/demandes/nouvelle"><Icon name="plus" /> Faire une demande</Link>
                <Link className="btn btn--teal btn--block" to="/app/demandes"><Icon name="list" /> Suivre mes demandes</Link>
                <Link className="btn btn--ghost btn--block" to="/verifier"><Icon name="search" /> Vérifier un acte</Link>
              </div>
            </div>
          </div>
          <div className="card" style={{ marginTop: "1.25rem" }}>
            <div className="row-between" style={{ marginBottom: "1rem" }}><h2 className="sm" style={{ margin: 0 }}>Dernières demandes</h2><Link to="/app/demandes">Tout voir</Link></div>
            <div className="list">
              {recentes.map((d) => (
                <Link key={d.id} className="row-card" to={`/app/demandes/${d.id}`}>
                  <span className="row-card__ico"><Icon name="doc" /></span>
                  <span className="row-card__main"><strong>{d.type_acte}</strong><small>{d.numero}</small></span>
                  <span className={`badge badge--${STATUT_TONE[d.statut]}`}>{STATUT_LABEL[d.statut]}</span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
