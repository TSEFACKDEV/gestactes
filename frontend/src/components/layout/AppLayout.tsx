import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Logo } from "@/components/ui";
import { useAuth } from "@/auth/AuthContext";
import { NAV_BY_ROLE, ROLE_LABEL } from "@/lib/roles";

/** Coquille commune à tous les espaces connectés : les modules des autres membres s'y branchent via <Outlet />. */
export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  if (!user) return null;
  const items = NAV_BY_ROLE[user.role];
  const initiales = `${user.prenom[0] ?? ""}${user.nom[0] ?? ""}`.toUpperCase();

  const quitter = () => { logout(); navigate("/connexion", { replace: true }); };

  return (
    <div className="shell">
      <aside className={`side${open ? " open" : ""}`}>
        <Logo light size={32} />
        <nav aria-label="Navigation de l'espace">
          {items.map((i) => (
            <NavLink key={i.to} to={i.to} end onClick={() => setOpen(false)}>
              <span aria-hidden="true">{i.icon}</span>{i.label}
            </NavLink>
          ))}
          <span style={{ flex: 1 }} />
          <button onClick={quitter}><span aria-hidden="true">⏻</span>Déconnexion</button>
        </nav>
      </aside>
      <div className="shell__main">
        <header className="shell__bar">
          <button className="btn btn--ghost mobile-only" onClick={() => setOpen((o) => !o)} aria-label="Ouvrir le menu">☰</button>
          <span className="spacer" />
          <div style={{ textAlign: "right", lineHeight: 1.2 }}>
            <strong style={{ color: "var(--ga-navy)", fontSize: ".9rem" }}>{user.prenom} {user.nom}</strong><br />
            <small style={{ color: "var(--ga-muted)" }}>{ROLE_LABEL[user.role]}</small>
          </div>
          <div className="avatar" aria-hidden="true">{initiales}</div>
        </header>
        <div className="shell__content"><Outlet /></div>
      </div>
    </div>
  );
}
