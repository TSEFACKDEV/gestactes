/**
 * Page d'accueil publique.
 * Propriétaire : GUEMOGNE GERALDINE ESTHER
 * TODO :
 *  [ ] Remplacer les données de démonstration par des exemples réels.
 *  [ ] Vérifier le rendu mobile 375 px.
 */

import {
  LuArrowRight,
  LuCircleCheck,
  LuFileCheck2,
  LuGitBranch,
  LuScanLine,
  LuShieldCheck,
} from "react-icons/lu";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";

const FEATURES = [
  {
    icon: LuGitBranch,
    title: "Traçabilité complète",
    text: "Chaque dépôt, correction et validation est historisé avec son auteur et sa date.",
  },
  {
    icon: LuShieldCheck,
    title: "Validation à quatre yeux",
    text: "L'agent instruit, le validateur contrôle et signe. Les rôles sont strictement séparés.",
  },
  {
    icon: LuScanLine,
    title: "Vérification publique",
    text: "Un numéro ou un QR code suffit pour vérifier l'authenticité d'un acte signé.",
  },
];

const STEPS = [
  ["01", "Déposer", "Le citoyen choisit un type d'acte et joint ses pièces."],
  ["02", "Instruire", "L'agent prend en charge la demande et rédige le brouillon."],
  ["03", "Valider", "Le validateur contrôle les différences et approuve ou corrige."],
  ["04", "Signer", "L'acte est signé, archivé et devient vérifiable."],
];

export function LandingPage() {
  return (
    <div>
      <section className="surface-grid border-b border-line">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-24">
          <div>
            <Badge variant="primary">Projet académique — ENSPD</Badge>
            <h1 className="mt-5 max-w-2xl font-display text-4xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-5xl">
              Des actes administratifs traçables, du dépôt à la signature.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-soft">
              GestActes dématérialise le circuit de vos demandes tout en
              conservant un historique fiable : chaque action est datée, relue
              et vérifiable.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/inscription">
                <Button
                  size="lg"
                  rightIcon={<LuArrowRight className="h-4 w-4" aria-hidden="true" />}
                >
                  Déposer une demande
                </Button>
              </Link>
              <Link to="/verification">
                <Button size="lg" variant="secondary">
                  Vérifier un acte
                </Button>
              </Link>
            </div>
            <p className="mt-5 text-xs text-ink-soft">
              Données fictives. Application de démonstration.
            </p>
          </div>

          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-soft">
                  Dossier
                </p>
                <p className="mt-1 font-mono text-sm font-medium text-ink">
                  2026-00042
                </p>
              </div>
              <StatusBadge statut="en_validation" />
            </div>
            <div className="space-y-5 p-5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-success-soft text-success">
                  <LuCircleCheck className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-medium text-ink">Demande déposée</p>
                  <p className="text-xs text-ink-soft">12 oct. 2026, 09:14</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-success-soft text-success">
                  <LuFileCheck2 className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-medium text-ink">Acte instruit</p>
                  <p className="text-xs text-ink-soft">12 oct. 2026, 11:02</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <LuShieldCheck className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-medium text-ink">En attente de validation</p>
                  <p className="text-xs text-ink-soft">Pull Request ouverte</p>
                </div>
              </div>
            </div>
            <div className="border-t border-line bg-surface-muted/60 px-5 py-3">
              <p className="text-xs text-ink-soft">
                Attestation de résidence — Awa Ndiaye
              </p>
            </div>
          </Card>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-primary">
            Ce que fait GestActes
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Un circuit simple, des preuves solides.
          </h2>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-ink">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {feature.text}
                </p>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="border-y border-line bg-surface">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-4">
          {STEPS.map(([number, title, text]) => (
            <div key={number}>
              <p className="font-mono text-xs font-medium text-accent">{number}</p>
              <h3 className="mt-2 font-display text-base font-semibold text-ink">
                {title}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-primary px-6 py-10 text-white sm:flex-row sm:items-center sm:px-10">
          <div>
            <h2 className="font-display text-2xl font-semibold">
              Prêt à déposer votre première demande ?
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/75">
              Créez un compte citoyen, choisissez un type d'acte et suivez son
              avancement étape par étape.
            </p>
          </div>
          <Link to="/inscription">
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-white/90"
              rightIcon={<LuArrowRight className="h-4 w-4" aria-hidden="true" />}
            >
              Commencer
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
