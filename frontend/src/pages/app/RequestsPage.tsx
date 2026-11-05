import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listDemandes } from "@/api/demandes";
import { Icon, Spinner } from "@/components/ui";
import { estDansGroupe, Groupe, STATUT_LABEL, STATUT_TONE } from "@/lib/demande";

const FILTRES: [Groupe, string][] = [["tous", "Toutes"], ["attente", "En attente"], ["validees", "Validées"], ["rejetees", "Rejetées"]];
const fmt = (iso: string) => new Date(iso).toLocaleDateString("fr-FR");

export default function RequestsPage() {
  const [params] = useSearchParams();
  const q = (params.get("q") ?? "").toLowerCase();
  const [groupe, setGroupe] = useState<Groupe>("tous");
  const { data, isLoading } = useQuery({ queryKey: ["demandes"], queryFn: listDemandes });

  const liste = useMemo(() => (data ?? [])
    .filter((d) => estDansGroupe(d.statut, groupe) && (!q || `${d.numero} ${d.type_acte}`.toLowerCase().includes(q)))
    .sort((a, b) => +new Date(b.cree_le) - +new Date(a.cree_le)), [data, groupe, q]);

  return (
    <>
      <div className="row-between" style={{ marginBottom: "1rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.6rem" }}>Mes demandes</h1>
        <Link className="btn btn--gold btn--sm" to="/app/demandes/nouvelle"><Icon name="plus" size={18} /> Faire une demande</Link>
      </div>
      {q && <p style={{ color: "var(--ga-muted)" }}>Résultats pour « {params.get("q")} »</p>}
      <div className="filters" role="group" aria-label="Filtrer par statut">
        {FILTRES.map(([g, l]) => <button key={g} aria-pressed={groupe === g} onClick={() => setGroupe(g)}>{l}</button>)}
      </div>
      {isLoading ? <div className="empty"><Spinner dark /></div> : liste.length === 0 ? (
        <div className="card empty"><Icon name="doc" size={36} /><p>Aucune demande ne correspond.</p><Link className="btn btn--gold" to="/app/demandes/nouvelle">Faire une demande</Link></div>
      ) : (
        <div className="list">
          {liste.map((d) => (
            <Link key={d.id} className="row-card" to={`/app/demandes/${d.id}`}>
              <span className="row-card__ico"><Icon name="doc" /></span>
              <span className="row-card__main"><strong>{d.type_acte}</strong><small>{d.numero} · déposée le {fmt(d.cree_le)}</small></span>
              <span className={`badge badge--${STATUT_TONE[d.statut]}`}>{STATUT_LABEL[d.statut]}</span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
