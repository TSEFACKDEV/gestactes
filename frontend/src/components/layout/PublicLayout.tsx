import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Icon, Logo } from "@/components/ui";
import { useAuth } from "@/auth/AuthContext";
import { HOME_BY_ROLE } from "@/lib/roles";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function PublicLayout() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { pathname, hash } = useLocation();

  // Ferme le menu mobile à chaque navigation et bloque le défilement quand il est ouvert.
  useEffect(() => setOpen(false), [pathname, hash]);
  useEffect(() => {
    document.body.classList.toggle("no-scroll", open);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => { document.body.classList.remove("no-scroll"); window.removeEventListener("keydown", onKey); };
  }, [open]);

  const surAccueil = pathname === "/";
  const faqActive = surAccueil && hash === "#faq";

  return (
    <div className="public">
      <header className="topbar">
        <div className="topbar__in">
          <Link to="/" aria-label="GestActes, retour à l'accueil"><Logo /></Link>
          <button className="burger" aria-expanded={open} aria-controls="nav-public" aria-label={open ? "Fermer le menu" : "Ouvrir le menu"} onClick={() => setOpen((o) => !o)}>
            <Icon name={open ? "close" : "menu"} size={22} />
          </button>
          <nav id="nav-public" className={open ? "open" : ""} aria-label="Navigation principale">
            <Link to="/" className={surAccueil && !faqActive ? "active" : ""}>Accueil</Link>
            <NavLink to="/verifier">Vérifier un acte</NavLink>
            <Link to="/#faq" className={faqActive ? "active" : ""}>FAQ</Link>
            {user
              ? <Link className="btn btn--navy btn--sm" to={HOME_BY_ROLE[user.role]}>Mon espace</Link>
              : <Link className="btn btn--navy btn--sm" to="/connexion">Se connecter</Link>}
          </nav>
          <ThemeToggle />
        </div>
      </header>
      {open && <div className="scrim" onClick={() => setOpen(false)} aria-hidden="true" />}
      <main className="main"><Outlet /></main>
      <footer className="footer">
        <div className="footer__grid">
          <div>
            <Link to="/" aria-label="GestActes, accueil"><Logo light size={34} /></Link>
            <p>Plateforme de gestion des actes administratifs : demande, instruction, validation, signature et archivage, avec un historique traçable et infalsifiable.</p>
            <div className="footer__tags"><span>Traçabilité GitHub</span><span>Signature SHA-256</span><span>Données fictives</span></div>
          </div>
          <div>
            <h3>Navigation</h3>
            <ul>
              <li><Link to="/">Accueil</Link></li>
              <li><Link to="/verifier">Vérifier un acte</Link></li>
              <li><Link to="/#faq">Questions fréquentes</Link></li>
            </ul>
          </div>
          <div>
            <h3>Espace citoyen</h3>
            <ul>
              <li><Link to="/connexion">Se connecter</Link></li>
              <li><Link to="/inscription">Créer un compte</Link></li>
              <li><Link to="/mot-de-passe-oublie">Mot de passe oublié</Link></li>
            </ul>
          </div>
          <div>
            <h3>Le projet</h3>
            <ul>
              <li>École Nationale Supérieure Polytechnique de Douala</li>
              <li>Architecture logicielle et objets répartis</li>
              <li>React · FastAPI · GitHub</li>
            </ul>
          </div>
        </div>
        <div className="footer__bar">
          <div>
            <span>© 2026 GestActes · Projet académique, aucune valeur légale</span>
            <button type="button" className="footer__top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><Icon name="arrow-up" size={16} /> Haut de page</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
