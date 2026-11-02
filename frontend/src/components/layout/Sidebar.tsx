/**
 * Navigation latérale.
 * Propriétaire : GUEMOGNE GERALDINE ESTHER
 * TODO : tester le responsive et la navigation clavier.
 */

import type { IconType } from "react-icons";
import {
  LuBell,
  LuClipboardCheck,
  LuFileCog,
  LuFilePlus2,
  LuFiles,
  LuInbox,
  LuLayoutDashboard,
  LuScrollText,
  LuUserRound,
  LuUsers,
} from "react-icons/lu";
import { NavLink } from "react-router-dom";

import { Brand } from "@/components/layout/Brand";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";

export interface NavItem {
  to: string;
  label: string;
  icon: IconType;
  end?: boolean;
}

export const NAV_ITEMS: Record<Role, NavItem[]> = {
  citoyen: [
    { to: "/app/tableau-de-bord", label: "Tableau de bord", icon: LuLayoutDashboard },
    { to: "/app/catalogue", label: "Demander un acte", icon: LuFilePlus2 },
    { to: "/app/demandes", label: "Mes demandes", icon: LuFiles },
  ],
  agent: [
    { to: "/app/agent/file", label: "File d'instruction", icon: LuInbox },
  ],
  validateur: [
    { to: "/app/validation/file", label: "File de validation", icon: LuClipboardCheck },
  ],
  admin: [
    {
      to: "/app/admin/tableau-de-bord",
      label: "Tableau de bord",
      icon: LuLayoutDashboard,
    },
    { to: "/app/admin/utilisateurs", label: "Utilisateurs", icon: LuUsers },
    { to: "/app/admin/types-actes", label: "Types d'actes", icon: LuFileCog },
    { to: "/app/admin/audit", label: "Journal d'audit", icon: LuScrollText },
  ],
};

const COMMON_ITEMS: NavItem[] = [
  { to: "/app/notifications", label: "Notifications", icon: LuBell },
  { to: "/app/profil", label: "Mon profil", icon: LuUserRound },
];

export function Sidebar({
  mobile = false,
  onNavigate,
}: {
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  const { user } = useAuth();
  const items = user ? [...NAV_ITEMS[user.role], ...COMMON_ITEMS] : COMMON_ITEMS;

  return (
    <aside
      className={cn(
        "flex h-full w-64 shrink-0 flex-col border-r border-line bg-surface",
        mobile ? "shadow-lifted" : "fixed inset-y-0 left-0 z-30 hidden lg:flex",
      )}
    >
      <div className="flex h-16 items-center border-b border-line px-5">
        <Brand />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Navigation principale">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition",
                  isActive
                    ? "bg-primary-soft text-primary"
                    : "text-ink-soft hover:bg-surface-muted hover:text-ink",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive ? (
                    <span
                      className="absolute left-0 top-1.5 h-6 w-0.5 rounded-full bg-primary"
                      aria-hidden="true"
                    />
                  ) : null}
                  <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-line px-5 py-4">
        <p className="text-xs text-ink-soft">GestActes v0.1.0</p>
        <p className="mt-1 text-[11px] leading-relaxed text-ink-soft/70">
          Actes traçables via GitHub
        </p>
      </div>
    </aside>
  );
}
