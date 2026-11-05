import { Link } from "react-router-dom";
import { Icon } from "@/components/ui";
import { Faq } from "@/components/ui/Faq";

export default function HomePage() {
  return (
    <>
      <section className="hero" aria-labelledby="titre-hero">
        <img className="hero__bg" src="/images/hotel-de-ville.webp" srcSet="/images/hotel-de-ville-800.webp 800w, /images/hotel-de-ville.webp 1200w" sizes="100vw"
          width={1200} height={1600} alt="" {...({ fetchpriority: "high" } as Record<string, string>)} decoding="async" />
        <div className="hero__in">
          <div>
            <span className="eyebrow">Service public numérique</span>
            <h1 id="titre-hero">Vérifiez l'<em>authenticité</em> de vos actes administratifs</h1>
            <p className="hero__lead">Un service fiable, rapide et sécurisé pour tous les citoyens camerounais. Demandez un acte en ligne, suivez son traitement et contrôlez sa validité en quelques secondes.</p>
            <div className="hero__cta">
              <Link className="btn btn--gold" to="/inscription">Faire une demande</Link>
              <Link className="btn btn--outline-light" to="/connexion">Se connecter</Link>
            </div>
            <div className="hero__trust">
              <span><Icon name="shield" size={18} /> Signature horodatée</span>
              <span><Icon name="lock" size={18} /> Données protégées</span>
              <span><Icon name="clock" size={18} /> Résultat immédiat</span>
            </div>
          </div>

        </div>
      </section>

      <div className="assurances">
        <div className="assurance"><span className="assurance__ico"><Icon name="shield" size={24} /></span><div><strong>Authenticité garantie</strong><span className="t">Empreinte SHA-256 et signature horodatée</span></div></div>
        <div className="assurance"><span className="assurance__ico"><Icon name="bolt" size={24} /></span><div><strong>Accès rapide</strong><span className="t">Un numéro ou un QR code suffit</span></div></div>
        <div className="assurance"><span className="assurance__ico"><Icon name="lock" size={24} /></span><div><strong>Sécurité</strong><span className="t">Données personnelles protégées</span></div></div>
      </div>

      <section className="section" aria-labelledby="t-how">
        <div className="section__head"><h2 id="t-how">Comment ça marche</h2><p>Trois étapes, du dépôt de la demande à l'acte signé.</p></div>
        <div className="steps">
          <div className="card step"><div className="step__n">1</div><h3>Créez votre compte</h3><p>Inscrivez-vous gratuitement avec votre e-mail pour déposer vos demandes d'actes.</p></div>
          <div className="card step"><div className="step__n">2</div><h3>Suivez votre demande</h3><p>Attestation de résidence, extrait de naissance ou autorisation : suivez chaque étape du traitement.</p></div>
          <div className="card step"><div className="step__n">3</div><h3>Récupérez et vérifiez</h3><p>Téléchargez votre acte signé. Toute personne peut en contrôler l'authenticité.</p></div>
        </div>
      </section>

      <section className="section" id="faq" aria-labelledby="t-faq">
        <div className="section__head"><h2 id="t-faq">Questions fréquentes</h2><p>Les réponses aux questions les plus courantes sur la vérification des actes.</p></div>
        <Faq />
      </section>

      <section className="section">
        <div className="cta-band">
          <div><h2>Prêt à faire votre demande ?</h2><p>Créez un compte citoyen en moins d'une minute.</p></div>
          <div className="row">
            <Link className="btn btn--gold" to="/inscription">Créer un compte</Link>
            <Link className="btn btn--outline-light" to="/connexion">Se connecter</Link>
          </div>
        </div>
      </section>
    </>
  );
}
