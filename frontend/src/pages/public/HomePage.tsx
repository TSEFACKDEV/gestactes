import { Link } from "react-router-dom";
import { IconBolt, IconLock, IconShield, IconSearch } from "@/components/ui";

function Facade() {
  return (
    <svg viewBox="0 0 360 260" width="100%" role="img" aria-label="Illustration d'un bâtiment administratif">
      <rect x="20" y="230" width="320" height="12" fill="#D9A441" />
      <path d="M40 90h280L180 30z" fill="#EAF2F8" />
      <circle cx="180" cy="66" r="12" fill="#168C83" />
      <rect x="50" y="96" width="260" height="14" fill="#fff" />
      {[70, 120, 170, 220, 270].map((x) => <rect key={x} x={x} y="114" width="20" height="108" rx="3" fill="#EAF2F8" opacity=".92" />)}
      <rect x="40" y="222" width="280" height="10" fill="#fff" />
      <rect x="165" y="170" width="30" height="52" rx="4" fill="#123B5D" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero__in">
          <div>
            <h1>Vérifiez l'authenticité de vos actes administratifs</h1>
            <p>Un service fiable, rapide et sécurisé pour tous les citoyens. Demandez un acte en ligne, suivez son traitement et contrôlez sa validité en quelques secondes.</p>
            <div className="hero__cta">
              <Link className="btn btn--gold" to="/verifier"><IconSearch /> Vérifier un acte</Link>
              <Link className="btn btn--ghost" style={{ color: "#fff", borderColor: "rgba(255,255,255,.5)" }} to="/connexion">Se connecter</Link>
            </div>
          </div>
          <div className="hero__art"><Facade /></div>
        </div>
      </section>

      <div className="assurances">
        <div className="assurance"><span className="assurance__ico"><IconShield /></span><div><strong>Authenticité garantie</strong><span>Empreinte SHA-256 et signature horodatée</span></div></div>
        <div className="assurance"><span className="assurance__ico"><IconBolt /></span><div><strong>Accès rapide</strong><span>Un numéro ou un QR code suffit</span></div></div>
        <div className="assurance"><span className="assurance__ico"><IconLock /></span><div><strong>Sécurité</strong><span>Données personnelles protégées</span></div></div>
      </div>

      <section className="section">
        <h2>Comment ça marche</h2>
        <div className="steps">
          <div className="card"><h3>1. Créez votre compte</h3><p>Inscrivez-vous gratuitement avec votre e-mail pour déposer des demandes d'actes.</p></div>
          <div className="card"><h3>2. Suivez votre demande</h3><p>Une attestation de résidence, un extrait de naissance ou une autorisation : suivez chaque étape.</p></div>
          <div className="card"><h3>3. Vérifiez un acte</h3><p>Chacun peut contrôler un acte signé avec son numéro, sans avoir besoin de compte.</p></div>
        </div>
      </section>
    </>
  );
}
