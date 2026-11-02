/**
 * Protection des routes authentifiées.
 * Propriétaire : GUEMOGNE GERALDINE ESTHER
 * TODO : tester le responsive et la navigation clavier.
 */

import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { FullPageSpinner } from "@/components/ui/Spinner";
import { useAuth } from "@/context/AuthContext";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullPageSpinner />;

  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/connexion?next=${next}`} replace />;
  }

  return <>{children}</>;
}
