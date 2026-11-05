import type { IconName } from "@/components/ui";

export type Role = "citoyen" | "agent" | "validateur" | "administrateur";

export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: Role;
  actif: boolean;
}

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

export interface NavItem { to: string; label: string; icon: IconName; end?: boolean }

/** Menu latéral par rôle (EF-03 : l'interface n'expose que ce que le rôle permet). */
export const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  citoyen: [
    { to: "/app", label: "Tableau de bord", icon: "grid", end: true },
    { to: "/app/demandes", label: "Mes demandes", icon: "list" },
    { to: "/verifier", label: "Vérification publique", icon: "search" },
    { to: "/app/profil", label: "Profil", icon: "user" },
  ],
  agent: [
    { to: "/agent", label: "File des demandes", icon: "list", end: true },
    { to: "/verifier", label: "Vérification publique", icon: "search" },
    { to: "/app/profil", label: "Profil", icon: "user" },
  ],
  validateur: [
    { to: "/validateur", label: "Actes à valider", icon: "check", end: true },
    { to: "/verifier", label: "Vérification publique", icon: "search" },
    { to: "/app/profil", label: "Profil", icon: "user" },
  ],
  administrateur: [
    { to: "/admin", label: "Administration", icon: "grid", end: true },
    { to: "/verifier", label: "Vérification publique", icon: "search" },
    { to: "/app/profil", label: "Profil", icon: "user" },
  ],
};

/** Droits principaux de chaque rôle (cahier des charges §2), affichés sur le profil. */
export const DROITS_BY_ROLE: Record<Role, string[]> = {
  citoyen: ["Déposer une demande d'acte et joindre des pièces", "Suivre l'état et l'historique de vos demandes", "Télécharger vos actes signés", "Vérifier l'authenticité d'un acte"],
  agent: ["Consulter la file des demandes et les prendre en charge", "Rédiger et modifier les brouillons d'actes", "Demander un complément d'information au citoyen", "Soumettre un acte à validation"],
  validateur: ["Consulter les actes en attente avec leurs différences", "Approuver, rejeter ou demander des corrections", "Signer les actes validés", "Consulter l'historique complet d'un acte"],
  administrateur: ["Créer, modifier et désactiver des utilisateurs", "Attribuer les rôles", "Gérer les modèles d'actes", "Consulter le journal d'audit et les statistiques"],
};
