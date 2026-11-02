/**
 * Barre supérieure.
 * Propriétaire : GUEMOGNE GERALDINE ESTHER
 * TODO : tester le responsive et la navigation clavier.
 */

import { useEffect, useRef, useState } from "react";
import {
  LuBell,
  LuChevronDown,
  LuLogOut,
  LuMenu,
  LuUserRound,
} from "react-icons/lu";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { Avatar } from "@/components/ui/Avatar";
import { NAV_ITEMS } from "@/components/layout/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { ROLE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const allItems = user
    ? [...NAV_ITEMS[user.role], { to: "/app/notifications", label: "Notifications" }, { to: "/app/profil", label: "Mon profil" }]
    : [];
  const current =
    allItems
      .filter((item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`))
      .sort((a, b) => b.to.length - a.to.length)[0]?.label ?? "GestActes";

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function handleLogout() {
    await logout();
    navigate("/connexion", { replace: true });
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-canvas/85 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenu}
          className="rounded-md p-2 text-ink-soft transition hover:bg-surface-muted hover:text-ink lg:hidden"
          aria-label="Ouvrir la navigation"
        >
          <LuMenu className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink">{current}</p>
          <p className="hidden text-xs text-ink-soft sm:block">
            {user ? ROLE_LABELS[user.role] : "GestActes"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link
          to="/app/notifications"
          className="relative rounded-md p-2 text-ink-soft transition hover:bg-surface-muted hover:text-ink"
          aria-label="Notifications"
        >
          <LuBell className="h-5 w-5" aria-hidden="true" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent" />
        </Link>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="flex items-center gap-2 rounded-md p-1.5 transition hover:bg-surface-muted"
            aria-haspopup="menu"
            aria-expanded={open}
          >
            <Avatar
              firstName={user?.first_name}
              lastName={user?.last_name}
              size="sm"
            />
            <span className="hidden text-sm font-medium text-ink sm:block">
              {user ? `${user.first_name} ${user.last_name}` : "Utilisateur"}
            </span>
            <LuChevronDown
              className={cn("hidden h-4 w-4 text-ink-soft transition sm:block", open && "rotate-180")}
              aria-hidden="true"
            />
          </button>

          {open ? (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-52 overflow-hidden rounded-lg border border-line bg-surface shadow-lifted animate-scale-in"
            >
              <div className="border-b border-line px-4 py-3">
                <p className="text-sm font-medium text-ink">
                  {user ? `${user.first_name} ${user.last_name}` : "Utilisateur"}
                </p>
                <p className="mt-0.5 truncate text-xs text-ink-soft">
                  {user?.email}
                </p>
              </div>
              <Link
                to="/app/profil"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-ink-soft transition hover:bg-surface-muted hover:text-ink"
                role="menuitem"
              >
                <LuUserRound className="h-4 w-4" aria-hidden="true" />
                Mon profil
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-danger transition hover:bg-danger-soft"
                role="menuitem"
              >
                <LuLogOut className="h-4 w-4" aria-hidden="true" />
                Se déconnecter
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
