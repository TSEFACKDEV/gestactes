/** États d'un acte (cahier des charges §6.4) et leur présentation côté citoyen. */
export type Statut = "demandee" | "en-instruction" | "en-validation" | "validee" | "signee" | "archivee" | "rejetee" | "annulee";

export interface Demande {
  id: number;
  numero: string;
  type_acte: string;
  statut: Statut;
  cree_le: string; // ISO 8601
}

export const STATUT_LABEL: Record<Statut, string> = {
  demandee: "Soumise",
  "en-instruction": "En instruction",
  "en-validation": "En validation",
  validee: "Validée",
  signee: "Signée",
  archivee: "Archivée",
  rejetee: "Rejetée",
  annulee: "Annulée",
};

export type Tone = "success" | "gold" | "danger" | "info" | "muted";
export const STATUT_TONE: Record<Statut, Tone> = {
  demandee: "info", "en-instruction": "gold", "en-validation": "gold", validee: "success", signee: "success", archivee: "success", rejetee: "danger", annulee: "muted",
};

export const ETAPES = ["Soumise", "En instruction", "En validation", "Signée"] as const;

/** Nombre d'étapes franchies : les étapes d'indice < progression sont terminées, l'étape égale est en cours. */
export const PROGRESSION: Record<Statut, number> = {
  demandee: 0, "en-instruction": 1, "en-validation": 2, validee: 3, signee: 4, archivee: 4, rejetee: -1, annulee: -1,
};

export type Groupe = "tous" | "attente" | "validees" | "rejetees";
export const GROUPES: Record<Exclude<Groupe, "tous">, Statut[]> = {
  attente: ["demandee", "en-instruction", "en-validation"],
  validees: ["validee", "signee", "archivee"],
  rejetees: ["rejetee", "annulee"],
};

export function estDansGroupe(s: Statut, g: Groupe): boolean {
  return g === "tous" || GROUPES[g].includes(s);
}

export function compterParGroupe(liste: Demande[]) {
  const n = (g: Exclude<Groupe, "tous">) => liste.filter((d) => GROUPES[g].includes(d.statut)).length;
  return { total: liste.length, attente: n("attente"), validees: n("validees"), rejetees: n("rejetees") };
}

/** Nombre de demandes déposées par tranche de `pas` jours sur les `jours` derniers jours (du plus ancien au plus récent). */
export function serieDepots(liste: Demande[], maintenant = new Date(), jours = 30, pas = 5): number[] {
  const nb = Math.ceil(jours / pas);
  const serie = new Array<number>(nb).fill(0);
  const fin = maintenant.getTime();
  for (const d of liste) {
    const age = (fin - new Date(d.cree_le).getTime()) / 86_400_000;
    if (age < 0 || age >= jours) continue;
    serie[nb - 1 - Math.floor(age / pas)]++;
  }
  return serie;
}
