import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Icon, IconName, Logo } from "@/components/ui";
import { useAuth } from "@/auth/AuthContext";
import { NAV_BY_ROLE, ROLE_LABEL } from "@/lib/roles";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

/** Coquille commune des espaces connectés : les modules des autres membres s'y branchent via <Outlet />. */
export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [notif, setNotif] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setOpen(false); setNotif(false); }, [pathname]);
  useEffect(() => {
    document.body.classList.toggle("no-scroll", open);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); setNotif(false); } };
    const onClick = (e: MouseEvent) => { if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotif(false); };
    window.addEventListener("keydown", onKey); document.addEventListener("mousedown", onClick);
    return () => { document.body.classList.remove("no-scroll"); window.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onClick); };
  }, [open]);

  if (!user) return null;
  const initiales = `${user.prenom[0] ?? ""}${user.nom[0] ?? ""}`.toUpperCase();
  const quitter = () => { logout(); navigate("/connexion", { replace: true }); };
  const rechercher = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = String(new FormData(e.currentTarget).get("q") ?? "").trim();
    navigate(q ? `/app/demandes?q=${encodeURIComponent(q)}` : "/app/demandes");
  };

  return (
    <div className="shell">
      {open && <div className="scrim" onClick={() => setOpen(false)} aria-hidden="true" />}
      <aside className={`side${open ? " open" : ""}`} aria-label="Menu latéral">
        <div className="side__head">
          <Link to="/" aria-label="GestActes, retour à l'accueil"><Logo light size={34} /></Link>
          <button className="close mobile-only" onClick={() => setOpen(false)} aria-label="Fermer le menu"><Icon name="close" /></button>
        </div>
        <nav aria-label="Navigation de l'espace">
          {NAV_BY_ROLE[user.role].map((i) => (
            <NavLink key={i.to} to={i.to} end={i.to === "/app" || i.to === "/verifier"}>
              <Icon name={i.icon as IconName} />{i.label}
            </NavLink>
          ))}
          <span style={{ flex: 1 }} />
          <Link to="/"><Icon name="home" />Site public</Link>
          <button onClick={quitter}><Icon name="logout" />Déconnexion</button>
        </nav>
      </aside>

      <div className="shell__main">
        <header className="shell__bar">
          <button className="iconbtn mobile-only" onClick={() => setOpen(true)} aria-label="Ouvrir le menu" aria-expanded={open}><Icon name="menu" /></button>
          <Link to="/" className="mobile-only" aria-label="Accueil"><Logo light size={30} /></Link>
          {user.role === "citoyen" && (
            <form className="search desktop-only" role="search" onSubmit={rechercher}>
              <Icon name="search" size={18} />
              <input name="q" type="search" placeholder="Rechercher une demande…" aria-label="Rechercher une demande" />
            </form>
          )}
          <span className="spacer" />
          <ThemeToggle />
          <div ref={notifRef} style={{ position: "relative" }}>
            <button className="iconbtn" aria-label="Notifications" aria-expanded={notif} onClick={() => setNotif((n) => !n)}><Icon name="bell" /></button>
            {notif && <div className="popover" role="dialog" aria-label="Notifications"><strong style={{ color: "var(--ga-navy)" }}>Notifications</strong><p style={{ margin: ".5rem 0 0" }}>Aucune nouvelle notification.</p></div>}
          </div>
          <div className="who desktop-only"><strong>{user.prenom} {user.nom}</strong><br /><small>{ROLE_LABEL[user.role]}</small></div>
          <Link to="/app/profil" className="avatar" aria-label="Mon profil" style={{ textDecoration: "none", color: "#fff" }}>{initiales}</Link>
        </header>
        <main className="shell__content"><Outlet /></main>
      </div>
    </div>
  );
}
