/**
 * Page 404.
 * Propriétaire : GUEMOGNE GERALDINE ESTHER
 * TODO : tester les notifications et la mise à jour du profil.
 */

import { LuArrowLeft, LuFileX } from "react-icons/lu";
import { Link } from "react-router-dom";

import { Brand } from "@/components/layout/Brand";
import { Button } from "@/components/ui/Button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-16 text-center">
      <Brand />
      <span className="mt-10 flex h-16 w-16 items-center justify-center rounded-full bg-surface-muted text-ink-soft">
        <LuFileX className="h-7 w-7" aria-hidden="true" />
      </span>
      <p className="mt-6 font-mono text-xs font-medium text-accent">404</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">
        Page introuvable
      </h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
        La page demandée n'existe pas ou a été déplacée. Revenez à l'accueil pour
        reprendre votre parcours.
      </p>
      <Link to="/" className="mt-6">
        <Button leftIcon={<LuArrowLeft className="h-4 w-4" aria-hidden="true" />}>
          Retour à l'accueil
        </Button>
      </Link>
    </div>
  );
}
