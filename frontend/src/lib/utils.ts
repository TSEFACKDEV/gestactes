/**
 * Utilitaires génériques.
 * Propriétaire : TSEFACK CALVIN KLEIN (contrat gelé).
 * TODO : maintenir l'alignement avec docs/api-contract.md et ajouter les tests.
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
