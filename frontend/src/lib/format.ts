/**
 * Formatage des dates, tailles et noms.
 * Propriétaire : TSEFACK CALVIN KLEIN (contrat gelé).
 * TODO : maintenir l'alignement avec docs/api-contract.md et ajouter les tests.
 */

import { format, formatDistanceToNow, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

import type { UserSummary } from "@/types";

export function formatDate(value?: string | null): string {
  if (!value) return "—";
  try {
    return format(parseISO(value), "dd MMM yyyy", { locale: fr });
  } catch {
    return "—";
  }
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  try {
    return format(parseISO(value), "dd MMM yyyy, HH:mm", { locale: fr });
  } catch {
    return "—";
  }
}

export function formatRelative(value?: string | null): string {
  if (!value) return "—";
  try {
    return formatDistanceToNow(parseISO(value), { addSuffix: true, locale: fr });
  } catch {
    return "—";
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function initials(firstName?: string, lastName?: string): string {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "?";
}

export function fullName(user?: UserSummary | null): string {
  if (!user) return "—";
  return `${user.first_name} ${user.last_name}`.trim();
}

export function formatNumero(numero: string): string {
  return numero.replace(/^(\d{4})-/, "$1-");
}
