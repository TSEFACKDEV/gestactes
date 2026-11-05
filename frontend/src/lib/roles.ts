/**
 * Rôles, navigation et droits.
 * Propriétaire : GUEMOGNE GERALDINE ESTHER
 * TODO : maintenir l'alignement avec docs/api-contract.md et les tests.
 */

import type { Role, User } from "@/types";
import type { IconName } from "@/components/ui";

export type { Role, User };

export const HOME_BY_ROLE: Record<Role, string> = {
  citoyen: "/app",
  agent: "/app/agent/file",
  validateur: "/app/validation/file",
  admin: "/app/admin/tableau-de-bord",
};

export const ROLE_LABEL: Record<Role, string> = {
  citoyen: "Citoyen",
  agent: "Agent",
  validateur: "Validateur",
  admin: "Administrateur",
};

export interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  end?: boolean;
}

/** Menu latéral par rôle. */
export const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  citoyen: [
    { to: "/app", label: "Tableau de bord", icon: "grid", end: true },
    { to: "/app/demandes", label: "Mes demandes", icon: "list" },
    { to: "/app/demandes/nouvelle", label: "Nouvelle demande", icon: "plus", end: true },
    { to: "/app/notifications", label: "Notifications", icon: "bell" },
    { to: "/app/profil", label: "Profil", icon: "user" },
  ],
  agent: [
    { to: "/app/agent/file", label: "File d'instruction", icon: "list", end: true },
    { to: "/app/notifications", label: "Notifications", icon: "bell" },
    { to: "/app/profil", label: "Profil", icon: "user" },
  ],
  validateur: [
    { to: "/app/validation/file", label: "File de validation", icon: "check", end: true },
    { to: "/app/notifications", label: "Notifications", icon: "bell" },
    { to: "/app/profil", label: "Profil", icon: "user" },
  ],
  admin: [
    { to: "/app/admin/tableau-de-bord", label: "Tableau de bord", icon: "grid", end: true },
    { to: "/app/admin/utilisateurs", label: "Utilisateurs", icon: "user" },
    { to: "/app/admin/types-actes", label: "Types d'actes", icon: "doc" },
    { to: "/app/admin/audit", label: "Journal d'audit", icon: "list" },
    { to: "/app/notifications", label: "Notifications", icon: "bell" },
    { to: "/app/profil", label: "Profil", icon: "user" },
  ],
};

export const DROITS_BY_ROLE: Record<Role, string[]> = {
  citoyen: [
    "Déposer une demande d'acte et joindre des pièces",
    "Suivre l'état et l'historique de vos demandes",
    "Télécharger vos actes signés",
    "Vérifier l'authenticité d'un acte",
  ],
  agent: [
    "Consulter la file des demandes et les prendre en charge",
    "Rédiger et modifier les brouillons d'actes",
    "Demander un complément d'information au citoyen",
    "Soumettre un acte à validation",
  ],
  validateur: [
    "Consulter les actes en attente avec leurs différences",
    "Approuver, rejeter ou demander des corrections",
    "Signer les actes validés",
    "Consulter l'historique complet d'un acte",
  ],
  admin: [
    "Créer, modifier et désactiver des utilisateurs",
    "Attribuer les rôles",
    "Gérer les modèles d'actes",
    "Consulter le journal d'audit et les statistiques",
  ],
};
