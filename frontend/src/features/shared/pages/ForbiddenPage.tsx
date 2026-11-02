/**
 * Page 403.
 * Propriétaire : GUEMOGNE GERALDINE ESTHER
 * TODO : tester les notifications et la mise à jour du profil.
 */

import { LuArrowLeft, LuShieldOff } from "react-icons/lu";
import { Link } from "react-router-dom";

import { Brand } from "@/components/layout/Brand";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { ROLE_HOME } from "@/lib/constants";

export function ForbiddenPage() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-16 text-center">
      <Brand />
      <span className="mt-10 flex h-16 w-16 items-center justify-center rounded-full bg-danger-soft text-danger">
        <LuShieldOff className="h-7 w-7" aria-hidden="true" />
      </span>
      <p className="mt-6 font-mono text-xs font-medium text-accent">403</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">
        Accès refusé
      </h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
        Votre rôle ne permet pas d'accéder à cette page. Si vous pensez qu'il
        s'agit d'une erreur, contactez un administrateur.
      </p>
      <Link to={user ? ROLE_HOME[user.role] : "/"} className="mt-6">
        <Button leftIcon={<LuArrowLeft className="h-4 w-4" aria-hidden="true" />}>
          Retour à mon espace
        </Button>
      </Link>
    </div>
  );
}
