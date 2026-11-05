import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { verifierActe } from "@/api/verification";
import { messageErreur } from "@/api/client";
import { Alert, BackLink, Icon, Spinner } from "@/components/ui";
import { numeroValide, normaliserNumero } from "@/lib/validation";

const STATUT = { signee: "Signée", archivee: "Signée et archivée" } as const;
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

export default function VerifyResultPage() {
  const { numero: brut = "" } = useParams();
  const numero = normaliserNumero(decodeURIComponent(brut));
  const valide = numeroValide(numero);

  const { data, isLoading, error } = useQuery({
    queryKey: ["verification", numero],
    queryFn: () => verifierActe(numero),
    enabled: valide,
    retry: 1,
  });

  return (
    <div className="page-narrow">
      <BackLink to="/verifier">Nouvelle vérification</BackLink>
      <div className="card" style={{ marginTop: ".5rem" }}>
        <h1 style={{ fontSize: "1.35rem" }}>Résultat de la vérification</h1>

        {!valide && <Introuvable numero={numero} texte="Le format du numéro est incorrect (attendu : AR-2026-00042)." />}
        {valide && isLoading && <div className="empty"><Spinner dark /></div>}
        {valide && error && <Alert kind="error">{messageErreur(error)}</Alert>}
        {valide && !isLoading && !error && data === null && <Introuvable numero={numero} texte="Aucun acte signé ne correspond à ce numéro. Le document n'est pas vérifiable." />}

        {data && data.authentique && (
          <>
            <div className="result__banner result__banner--ok">
              <Icon name="check" size={44} />
              <div><h2>Acte authentique et valide</h2><p>Signé et conservé dans GestActes.</p></div>
            </div>
            <h3 style={{ fontSize: ".95rem" }}>Détails (informations publiques)</h3>
            <dl className="dl">
              <div><dt>Numéro de l'acte</dt><dd>{data.numero}</dd></div>
              <div><dt>Type d'acte</dt><dd>{data.type_acte}</dd></div>
              {data.date_delivrance && <div><dt>Délivré le</dt><dd>{fmtDate(data.date_delivrance)}</dd></div>}
              {data.commune && <div><dt>Commune</dt><dd>{data.commune}</dd></div>}
              <div><dt>Statut de signature</dt><dd><span className="badge badge--success">{STATUT[data.statut]}</span></dd></div>
              {data.empreinte_sha256 && <div><dt>Empreinte SHA-256</dt><dd style={{ fontFamily: "monospace", fontSize: ".78rem" }}>{data.empreinte_sha256.slice(0, 16)}…</dd></div>}
            </dl>
            <p className="privacy"><Icon name="shield" size={18} /> Aucune donnée personnelle (nom, adresse, date de naissance) n'est affichée.</p>
          </>
        )}

        {data && !data.authentique && (
          <Introuvable numero={data.numero} texte="Cet acte n'est pas encore signé ou archivé." />
        )}

        <div className="stack" style={{ marginTop: "1rem" }}>
          <Link className="btn btn--teal btn--block" to="/verifier">Vérifier un autre acte</Link>
          <Link className="btn btn--ghost btn--block" to="/">Retour à l'accueil</Link>
        </div>
      </div>
    </div>
  );
}

function Introuvable({ numero, texte }: { numero: string; texte: string }) {
  return (
    <div className="result__banner result__banner--ko">
      <Icon name="cross" size={44} />
      <div><h2>Acte non vérifiable</h2><p>{numero ? `${numero} : ` : ""}{texte}</p></div>
    </div>
  );
}
