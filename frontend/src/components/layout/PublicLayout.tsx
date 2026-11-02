/**
 * Coque des pages publiques.
 * Propriétaire : GUEMOGNE GERALDINE ESTHER
 * TODO : tester le responsive et la navigation clavier.
 */

import { Link, Outlet } from "react-router-dom";

import { Brand } from "@/components/layout/Brand";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";

export function PublicLayout() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="border-b border-line bg-canvas/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Brand />
          <nav className="flex items-center gap-2 sm:gap-3" aria-label="Navigation publique">
            <Link
              to="/verification"
              className="hidden rounded-md px-3 py-2 text-sm font-medium text-ink-soft transition hover:bg-surface-muted hover:text-ink sm:block"
            >
              Vérifier un acte
            </Link>
            {user ? (
              <Link to="/app">
                <Button size="sm">Mon espace</Button>
              </Link>
            ) : (
              <>
                <Link
                  to="/connexion"
                  className="rounded-md px-3 py-2 text-sm font-medium text-ink-soft transition hover:bg-surface-muted hover:text-ink"
                >
                  Se connecter
                </Link>
                <Link to="/inscription">
                  <Button size="sm">Créer un compte</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-ink-soft sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>GestActes — projet académique, données fictives.</p>
          <p>Architecture logicielle et objets répartis — ENSPD.</p>
        </div>
      </footer>
    </div>
  );
}
