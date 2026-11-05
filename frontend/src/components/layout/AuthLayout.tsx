import { Link, Outlet } from "react-router-dom";
import { Logo } from "@/components/ui";

export function AuthLayout() {
  return (
    <div className="auth">
      <aside className="auth__brand">
        <Link to="/" aria-label="Retour à l'accueil"><Logo light size={52} /></Link>
        <h2>Une administration plus proche de vous</h2>
        <p>Demandez, suivez et vérifiez vos actes administratifs en ligne.</p>
      </aside>
      <section className="auth__panel"><div className="auth__form"><Outlet /></div></section>
    </div>
  );
}
