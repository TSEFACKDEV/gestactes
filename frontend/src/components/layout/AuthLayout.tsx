import { Link, Outlet } from "react-router-dom";
import { BackLink, Icon, Logo } from "@/components/ui";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function AuthLayout() {
  return (
    <div className="auth">
      <aside className="auth__brand">
        <Link to="/" aria-label="GestActes, retour à l'accueil">
          <Logo light size={44} />
        </Link>
        <div>
          <span className="auth__kicker">Commune de Douala 5e</span>
          <h2>Vos démarches, sans file d'attente.</h2>
          <p>
            Déposez, suivez et vérifiez vos actes administratifs auprès de votre
            commune, depuis un seul espace.
          </p>
          <ul className="auth__points">
            <li><Icon name="check" size={18} /> Attestation de résidence</li>
            <li><Icon name="check" size={18} /> Extrait d'acte de naissance</li>
            <li><Icon name="check" size={18} /> Autorisation de bâtir</li>
          </ul>
        </div>
        <p className="auth__note">Projet académique — données fictives.</p>
      </aside>
      <section className="auth__panel">
        <div className="auth__top">
          <BackLink to="/">Retour à l'accueil</BackLink>
          <ThemeToggle />
        </div>
        <div className="auth__center">
          <div className="auth__form">
            <div className="auth__mobile-logo">
              <Link to="/" aria-label="GestActes, retour à l'accueil">
                <Logo size={44} />
              </Link>
            </div>
            <Outlet />
            <p className="auth__alt">
              <Link to="/verifier">Vérifier l'authenticité d'un acte sans compte</Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
