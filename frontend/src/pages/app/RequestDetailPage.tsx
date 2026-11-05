import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getDemande } from "@/api/demandes";
import { Alert, BackLink, Button, Icon, Spinner } from "@/components/ui";
import { ETAPES, PROGRESSION, STATUT_LABEL, STATUT_TONE } from "@/lib/demande";

/** Détail d'une demande : une seule carte, sur toute la largeur de l'espace disponible. */
export default function RequestDetailPage() {
  const id = Number(useParams().id);
  const { data, isLoading } = useQuery({ queryKey: ["demande", id], queryFn: () => getDemande(id) });

  if (isLoading) return <div className="empty"><Spinner dark /></div>;
  if (!data) return <><BackLink to="/app/demandes">Mes demandes</BackLink><Alert kind="error">Cette demande est introuvable.</Alert></>;

  const p = PROGRESSION[data.statut];
  const telechargeable = p === 4;

  return (
    <div className="detail-full">
      <BackLink to="/app/demandes">Mes demandes</BackLink>
      <div className="card" style={{ marginTop: ".5rem" }}>
        <h1 style={{ fontSize: "1.5rem" }}>Détail d'une demande</h1>
        {p >= 0 ? (
          <ol className="stepper" aria-label="Avancement de la demande">
            {ETAPES.map((e, i) => (
              <li key={e} className={i < p ? "done" : i === p ? "current" : ""} aria-current={i === p ? "step" : undefined}>
                <span className="dotn">{i < p ? <Icon name="check" size={18} /> : i + 1}</span>{e}
              </li>
            ))}
          </ol>
        ) : (
          <Alert kind="error">{data.statut === "rejetee" ? "Cette demande a été rejetée." : "Cette demande a été annulée."}</Alert>
        )}
        <h3>Informations de la demande</h3>
        <dl className="dl">
          <div><dt>N° de demande</dt><dd>{data.numero}</dd></div>
          <div><dt>Type</dt><dd>{data.type_acte}</dd></div>
          <div><dt>Date de dépôt</dt><dd>{new Date(data.cree_le).toLocaleDateString("fr-FR")}</dd></div>
          <div><dt>Statut</dt><dd><span className={`badge badge--${STATUT_TONE[data.statut]}`}>{STATUT_LABEL[data.statut]}</span></dd></div>
        </dl>
        <Button variant="navy" disabled={!telechargeable} title={telechargeable ? "" : "Disponible une fois l'acte signé"}>
          <Icon name="download" size={18} /> Télécharger le document
        </Button>
        {!telechargeable && p >= 0 && <p style={{ color: "var(--ga-muted)", fontSize: ".85rem", margin: ".75rem 0 0" }}>Le document sera disponible une fois l'acte signé.</p>}
      </div>
    </div>
  );
}
