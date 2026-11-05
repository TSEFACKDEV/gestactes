import { Link } from "react-router-dom";
import { Icon } from "@/components/ui";
import { Faq } from "@/components/ui/Faq";

export default function HomePage() {
  return (
    <>
      <section className="hero" aria-labelledby="titre-hero">
        <div className="hero__in">
          <div className="hero__text">
            <span className="eyebrow">Service public numérique — Cameroun</span>
            <h1 id="titre-hero">
              Vos actes administratifs, délivrés par <em>votre commune</em>.
            </h1>
            <p className="hero__lead">
              Demandez une attestation de résidence, un extrait d'acte de
              naissance ou une autorisation de bâtir. Suivez chaque étape et
              vérifiez l'authenticité de votre document en ligne.
            </p>
            <div className="hero__cta">
              <Link className="btn btn--gold" to="/inscription">
                Déposer une demande
              </Link>
              <Link className="btn btn--outline" to="/verifier">
                Vérifier un acte
              </Link>
            </div>
            <div className="hero__trust">
              <span><Icon name="mapin" size={18} /> Commune de Douala 5e</span>
              <span><Icon name="clock" size={18} /> Suivi en ligne</span>
              <span><Icon name="shield" size={18} /> Vérification par QR code</span>
            </div>
            <p className="hero__note">
              Démonstration avec données fictives. Les modèles d'actes sont
              adaptables à d'autres communes et pays.
            </p>
          </div>

          <figure className="hero__media">
            <img
              src="/images/mairie-douala-5-1280.jpg"
              srcSet="/images/mairie-douala-5-800.jpg 800w, /images/mairie-douala-5-1280.jpg 1280w"
              sizes="(max-width: 900px) 100vw, 45vw"
              width={1280}
              height={960}
              alt="Façade de la mairie de Douala 5e, à Bonamoussadi"
              {...({ fetchpriority: "high" } as Record<string, string>)}
              decoding="async"
            />
            <figcaption>
              <span>Mairie de Douala 5e — Bonamoussadi</span>
              <a
                href="https://commons.wikimedia.org/wiki/File:Mairie_de_Douala_V.jpg"
                target="_blank"
                rel="noreferrer"
              >
                Photo : Minette Lontsie, CC BY-SA 4.0
              </a>
            </figcaption>
          </figure>
        </div>
      </section>

      <div className="assurances">
        <div className="assurance">
          <span className="assurance__ico"><Icon name="shield" size={24} /></span>
          <div>
            <strong>Délivré par votre commune</strong>
            <span className="t">Un circuit administratif clair, du dépôt à la signature.</span>
          </div>
        </div>
        <div className="assurance">
          <span className="assurance__ico"><Icon name="clock" size={24} /></span>
          <div>
            <strong>Suivi transparent</strong>
            <span className="t">Chaque étape est datée et consultable en ligne.</span>
          </div>
        </div>
        <div className="assurance">
          <span className="assurance__ico"><Icon name="search" size={24} /></span>
          <div>
            <strong>Vérification publique</strong>
            <span className="t">Un numéro ou un QR code suffit pour contrôler un acte.</span>
          </div>
        </div>
      </div>

      <section className="section" aria-labelledby="t-how">
        <div className="section__head">
          <h2 id="t-how">Comment ça marche</h2>
          <p>Trois étapes, du dossier déposé à l'acte vérifiable.</p>
        </div>
        <div className="steps">
          <div className="card step">
            <div className="step__n">1</div>
            <h3>Préparez votre dossier</h3>
            <p>
              Choisissez le type d'acte, remplissez le formulaire et joignez les
              pièces demandées : justificatif de domicile, acte de naissance,
              plan de situation, etc.
            </p>
          </div>
          <div className="card step">
            <div className="step__n">2</div>
            <h3>Suivez l'instruction</h3>
            <p>
              Un agent de la commune instruit votre demande. Vous êtes informé
              lorsqu'un complément est nécessaire ou lorsque l'acte est validé.
            </p>
          </div>
          <div className="card step">
            <div className="step__n">3</div>
            <h3>Retirez et vérifiez</h3>
            <p>
              Une fois signé, votre acte est archivé et téléchargeable. Son
              numéro et son QR code permettent à chacun d'en vérifier
              l'authenticité.
            </p>
          </div>
        </div>
      </section>

      <section className="section" id="faq" aria-labelledby="t-faq">
        <div className="section__head">
          <h2 id="t-faq">Questions fréquentes</h2>
          <p>Les réponses aux questions courantes sur les démarches et la vérification.</p>
        </div>
        <Faq />
      </section>

      <section className="section">
        <div className="cta-band">
          <div>
            <h2>Prêt à déposer votre demande ?</h2>
            <p>Créez un compte citoyen et suivez votre dossier en ligne.</p>
          </div>
          <div className="row">
            <Link className="btn btn--gold" to="/inscription">Créer un compte</Link>
            <Link className="btn btn--outline-light" to="/connexion">Se connecter</Link>
          </div>
        </div>
      </section>
    </>
  );
}
