/**
 * Coque visuelle des pages d'authentification.
 * Propriétaire : GUEMOGNE GERALDINE ESTHER
 * TODO : tester les erreurs 401/409 et le rendu mobile.
 */

import type { ReactNode } from "react";
import {
  LuFileCheck2,
  LuGitBranch,
  LuShieldCheck,
} from "react-icons/lu";

import { Brand } from "@/components/layout/Brand";

const ARGUMENTS = [
  {
    icon: LuGitBranch,
    title: "Chaque action est historisée",
    text: "Les demandes, corrections et validations laissent une trace datée.",
  },
  {
    icon: LuShieldCheck,
    title: "Validation à quatre yeux",
    text: "Un agent instruit, un validateur contrôle et signe.",
  },
  {
    icon: LuFileCheck2,
    title: "Un acte vérifiable",
    text: "Le PDF signé porte un numéro et une empreinte consultable.",
  },
];

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="mx-auto grid min-h-[calc(100vh-8rem)] w-full max-w-6xl items-stretch gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:py-16">
      <section className="hidden flex-col justify-between rounded-2xl bg-primary p-10 text-white lg:flex">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/70">
            GestActes
          </p>
          <h2 className="mt-4 max-w-sm font-display text-3xl font-semibold leading-tight">
            Un circuit clair, une trace vérifiable.
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/75">
            Déposez, instruisez, validez et signez vos actes administratifs dans
            un espace unique, adossé à l'historique GitHub.
          </p>
        </div>

        <ul className="mt-10 space-y-6">
          {ARGUMENTS.map((argument) => {
            const Icon = argument.icon;
            return (
              <li key={argument.title} className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-medium text-white">{argument.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-white/65">
                    {argument.text}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>

        <p className="mt-10 text-xs text-white/50">
          Projet académique — données fictives.
        </p>
      </section>

      <section className="flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Brand />
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            {title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{description}</p>
          <div className="mt-7">{children}</div>
          {footer ? <div className="mt-6 text-sm text-ink-soft">{footer}</div> : null}
        </div>
      </section>
    </div>
  );
}
