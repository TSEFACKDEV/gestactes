import { Link, Outlet } from "react-router-dom";
import { BackLink, Logo } from "@/components/ui";
import { Wave } from "@/components/ui/Illustrations";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function AuthLayout() {
  return (
    <div className="auth">
      <aside className="auth__brand">
        <img className="auth__bg" src="/images/hotel-de-ville-800.webp" srcSet="/images/hotel-de-ville-800.webp 800w, /images/hotel-de-ville.webp 1200w" sizes="45vw" width={800} height={1067} alt="" decoding="async" />
        <Link to="/" aria-label="GestActes, retour à l'accueil"><Logo light size={60} /></Link>
        <h2>Une administration plus proche de vous</h2>
        <p>Demandez, suivez et vérifiez vos actes administratifs en ligne.</p>
        <Wave />
      </aside>
      <section className="auth__panel">
        <div className="auth__top"><BackLink to="/">Retour à l'accueil</BackLink><ThemeToggle /></div>
        <div className="auth__center">
          <div className="auth__form">
            <div className="auth__mobile-logo"><Link to="/" aria-label="GestActes, retour à l'accueil"><Logo size={44} /></Link></div>
            <Outlet />
            <p className="auth__alt"><Link to="/verifier">Vérifier l'authenticité d'un acte sans compte</Link></p>
          </div>
        </div>
      </section>
    </div>
  );
}
