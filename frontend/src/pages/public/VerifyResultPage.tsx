import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { verifierActe } from "@/api/verification";
import { messageErreur } from "@/api/client";
import { Alert, IconCheck, IconCross, IconShield, Spinner } from "@/components/ui";
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
    <div className="verify">
      <div className="card result">
        <h1 style={{ fontSize: "1.3rem", textAlign: "left" }}>Résultat de la vérification</h1>

        {!valide && <Introuvable numero={numero} texte="Le format du numéro est incorrect (attendu : ACTE-2026-00042)." />}
        {valide && isLoading && <div style={{ padding: "2rem" }}><Spinner dark /></div>}
        {valide && error && <Alert kind="error">{messageErreur(error)}</Alert>}
        {valide && !isLoading && !error && data === null && <Introuvable numero={numero} texte="Aucun acte signé ne correspond à ce numéro. Le document n'est pas vérifiable." />}

        {data && (
          <>
            <div className="result__banner result__banner--ok">
              <IconCheck size={40} />
              <div><h2>Acte authentique et valide</h2><p>Signé et conservé dans GestActes.</p></div>
            </div>
            <h3 style={{ textAlign: "left", fontSize: ".95rem" }}>Détails (informations publiques)</h3>
            <dl className="dl">
              <div><dt>Numéro de l'acte</dt><dd>{data.numero}</dd></div>
              <div><dt>Type d'acte</dt><dd>{data.type_acte}</dd></div>
              <div><dt>Délivré le</dt><dd>{fmtDate(data.date_delivrance)}</dd></div>
              {data.commune && <div><dt>Commune</dt><dd>{data.commune}</dd></div>}
              <div><dt>Statut de signature</dt><dd><span className="badge badge--success">{STATUT[data.statut]}</span></dd></div>
              <div><dt>Empreinte SHA-256</dt><dd style={{ fontFamily: "monospace", fontSize: ".75rem" }}>{data.empreinte_sha256.slice(0, 16)}…</dd></div>
            </dl>
            <p className="privacy"><IconShield /> Aucune donnée personnelle (nom, adresse, date de naissance) n'est affichée.</p>
          </>
        )}

        <Link className="btn btn--ghost btn--block" style={{ marginTop: "1rem" }} to="/verifier">Vérifier un autre acte</Link>
      </div>
    </div>
  );
}

function Introuvable({ numero, texte }: { numero: string; texte: string }) {
  return (
    <div className="result__banner result__banner--ko">
      <IconCross size={40} />
      <div><h2>Acte non vérifiable</h2><p>{numero ? `${numero} : ` : ""}{texte}</p></div>
    </div>
  );
}
