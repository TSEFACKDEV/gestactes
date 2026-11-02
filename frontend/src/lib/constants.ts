/**
 * Constantes partagées.
 * Propriétaire : TSEFACK CALVIN KLEIN (contrat gelé).
 * TODO : maintenir l'alignement avec docs/api-contract.md et ajouter les tests.
 */

import type { DecisionType, Role, Statut } from "@/types";

export const PAGE_SIZE = 20;
export const MAX_FILES = 3;
export const MAX_FILE_SIZE_MB = 5;
export const ACCEPTED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png"];

export const ROLE_LABELS: Record<Role, string> = {
  citoyen: "Citoyen",
  agent: "Agent",
  validateur: "Validateur",
  admin: "Administrateur",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  citoyen: "Dépose et suit vos demandes d'actes.",
  agent: "Instruit les demandes et rédige les actes.",
  validateur: "Contrôle, valide et signe les actes.",
  admin: "Gère les comptes, les types d'actes et l'audit.",
};

export const ROLE_HOME: Record<Role, string> = {
  citoyen: "/app/tableau-de-bord",
  agent: "/app/agent/file",
  validateur: "/app/validation/file",
  admin: "/app/admin/tableau-de-bord",
};

export const STATUT_LABELS: Record<Statut, string> = {
  demandee: "Demandée",
  en_instruction: "En instruction",
  en_validation: "En validation",
  validee: "Validée",
  signee: "Signée",
  archivee: "Archivée",
  rejetee: "Rejetée",
  annulee: "Annulée",
};

export const STATUT_STYLES: Record<Statut, string> = {
  demandee: "bg-warning-soft text-warning",
  en_instruction: "bg-info-soft text-info",
  en_validation: "bg-[#F1ECFA] text-[#6B4FA8]",
  validee: "bg-success-soft text-success",
  signee: "bg-primary-soft text-primary",
  archivee: "bg-surface-muted text-ink-soft",
  rejetee: "bg-danger-soft text-danger",
  annulee: "bg-surface-muted text-ink-soft",
};

export const STATUT_DOTS: Record<Statut, string> = {
  demandee: "bg-warning",
  en_instruction: "bg-info",
  en_validation: "bg-[#6B4FA8]",
  validee: "bg-success",
  signee: "bg-primary",
  archivee: "bg-ink-soft",
  rejetee: "bg-danger",
  annulee: "bg-ink-soft",
};

export const DECISION_LABELS: Record<DecisionType, string> = {
  approuver: "Approuver",
  demander_corrections: "Demander des corrections",
  rejeter: "Rejeter",
};

export const FIELD_TYPE_LABELS: Record<string, string> = {
  text: "Texte court",
  textarea: "Texte long",
  date: "Date",
  number: "Nombre",
  select: "Liste déroulante",
  checkbox: "Case à cocher",
  file: "Fichier",
};
