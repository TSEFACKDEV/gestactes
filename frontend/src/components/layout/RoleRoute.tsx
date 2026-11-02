/**
 * Protection des routes par rôle.
 * Propriétaire : GUEMOGNE GERALDINE ESTHER
 * TODO : tester le responsive et la navigation clavier.
 */

import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "@/context/AuthContext";
import type { Role } from "@/types";

export function RoleRoute({
  roles,
  children,
}: {
  roles: Role[];
  children: ReactNode;
}) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/connexion" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/acces-refuse" replace />;

  return <>{children}</>;
}
