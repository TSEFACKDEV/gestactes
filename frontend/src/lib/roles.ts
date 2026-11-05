export type Role = "citoyen" | "agent" | "validateur" | "administrateur";

export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: Role;
  actif: boolean;
}

/** Page d'accueil de chaque rôle après connexion. */
export const HOME_BY_ROLE: Record<Role, string> = {
  citoyen: "/app",
  agent: "/agent",
  validateur: "/validateur",
  administrateur: "/admin",
};

export const ROLE_LABEL: Record<Role, string> = {
  citoyen: "Citoyen",
  agent: "Agent",
  validateur: "Validateur",
  administrateur: "Administrateur",
};

export interface NavItem { to: string; label: string; icon: string }

/** Menu latéral par rôle (EF-03 : l'interface n'expose que ce que le rôle permet). */
export const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  citoyen: [
    { to: "/app", label: "Tableau de bord", icon: "▦" },
    { to: "/app/demandes", label: "Mes demandes", icon: "☰" },
    { to: "/verifier", label: "Vérification publique", icon: "⌕" },
    { to: "/app/profil", label: "Profil", icon: "☺" },
  ],
  agent: [
    { to: "/agent", label: "File des demandes", icon: "☰" },
    { to: "/verifier", label: "Vérification publique", icon: "⌕" },
    { to: "/app/profil", label: "Profil", icon: "☺" },
  ],
  validateur: [
    { to: "/validateur", label: "Actes à valider", icon: "✔" },
    { to: "/verifier", label: "Vérification publique", icon: "⌕" },
    { to: "/app/profil", label: "Profil", icon: "☺" },
  ],
  administrateur: [
    { to: "/admin", label: "Administration", icon: "⚙" },
    { to: "/verifier", label: "Vérification publique", icon: "⌕" },
    { to: "/app/profil", label: "Profil", icon: "☺" },
  ],
};
