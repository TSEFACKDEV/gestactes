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

/** Libellés lisibles des actions d'audit. */
export const ACTION_LABELS: Record<string, string> = {
  "demande.creer": "Demande déposée",
  "demande.prendre_en_charge": "Prise en charge",
  "demande.contenu_modifier": "Brouillon mis à jour",
  "demande.soumettre": "Soumise à validation",
  "demande.approuver": "Approuvée",
  "demande.demander_corrections": "Corrections demandées",
  "demande.rejeter": "Rejetée",
  "demande.signer": "Signée",
  "demande.annuler": "Annulée",
  "demande.archiver": "Archivée",
};

export function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action.replaceAll("_", " ").replaceAll(".", " · ");
}

export function eventDescription(actor: string, message: string): string {
  const raw = (message ?? "").trim();
  if (!raw || raw === "{}") return actor;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (parsed && typeof parsed === "object") {
      const parts: string[] = [];
      if (typeof parsed.comment === "string" && parsed.comment) parts.push(parsed.comment);
      if (typeof parsed.message === "string" && parsed.message) parts.push(parsed.message);
      if (typeof parsed.from === "string" && typeof parsed.to === "string") {
        parts.push(`${parsed.from} → ${parsed.to}`);
      }
      if (parts.length > 0) return `${actor} — ${parts.join(" · ")}`;
    }
  } catch {
    // Message non JSON : on l'affiche tel quel.
  }
  return `${actor} — ${raw}`;
}

/** Message court expliquant la prochaine étape d'une demande. */
export const NEXT_STEP: Record<Statut, string> = {
  demandee: "Votre demande attend d'être prise en charge par un agent.",
  "en-instruction": "Un agent instruit votre dossier et prépare l'acte.",
  "en-validation": "Votre acte est en cours de contrôle par un validateur.",
  validee: "Votre acte est validé, en attente de signature.",
  signee: "Votre acte est signé. Le PDF sera bientôt disponible.",
  archivee: "Votre acte est archivé et téléchargeable.",
  rejetee: "Votre demande a été rejetée. Consultez le motif dans le dossier.",
  annulee: "Votre demande a été annulée.",
};
