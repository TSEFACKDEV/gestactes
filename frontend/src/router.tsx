/**
 * Routage de l'application.
 * Propriétaire : TSEFACK CALVIN KLEIN (contrat gelé).
 * Les routes sont pré-câblées ; les membres ne modifient pas ce fichier.
 * TODO : maintenir les routes et les protections par rôle.
 */

import { Navigate, Route, Routes } from "react-router-dom";

import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { RoleRoute } from "@/components/layout/RoleRoute";
import { useAuth } from "@/context/AuthContext";
import { AdminAuditPage } from "@/features/admin/pages/AuditPage";
import { AdminDashboardPage } from "@/features/admin/pages/DashboardPage";
import { AdminTypesPage } from "@/features/admin/pages/TypesPage";
import { AdminUsersPage } from "@/features/admin/pages/UsersPage";
import { AgentInstructionPage } from "@/features/agent/pages/InstructionPage";
import { AgentQueuePage } from "@/features/agent/pages/QueuePage";
import { ForgotPasswordPage } from "@/features/auth/pages/ForgotPasswordPage";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { RegisterPage } from "@/features/auth/pages/RegisterPage";
import { ResetPasswordPage } from "@/features/auth/pages/ResetPasswordPage";
import { CitizenCataloguePage } from "@/features/citizen/pages/CataloguePage";
import { CitizenDashboardPage } from "@/features/citizen/pages/DashboardPage";
import { NewRequestPage } from "@/features/citizen/pages/NewRequestPage";
import { RequestDetailPage } from "@/features/citizen/pages/RequestDetailPage";
import { CitizenRequestsPage } from "@/features/citizen/pages/RequestsPage";
import { LandingPage } from "@/features/public/pages/LandingPage";
import { VerificationPage } from "@/features/public/pages/VerificationPage";
import { ForbiddenPage } from "@/features/shared/pages/ForbiddenPage";
import { NotFoundPage } from "@/features/shared/pages/NotFoundPage";
import { NotificationsPage } from "@/features/shared/pages/NotificationsPage";
import { ProfilePage } from "@/features/shared/pages/ProfilePage";
import { ValidatorQueuePage } from "@/features/validator/pages/QueuePage";
import { ValidatorReviewPage } from "@/features/validator/pages/ReviewPage";
import { ROLE_HOME } from "@/lib/constants";

function RoleHomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/connexion" replace />;
  return <Navigate to={ROLE_HOME[user.role]} replace />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/connexion" element={<LoginPage />} />
        <Route path="/inscription" element={<RegisterPage />} />
        <Route path="/mot-de-passe-oublie" element={<ForgotPasswordPage />} />
        <Route path="/reinitialiser" element={<ResetPasswordPage />} />
        <Route path="/verification" element={<VerificationPage />} />
        <Route path="/verification/:numero" element={<VerificationPage />} />
      </Route>

      <Route path="/acces-refuse" element={<ForbiddenPage />} />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<RoleHomeRedirect />} />

        <Route
          path="tableau-de-bord"
          element={
            <RoleRoute roles={["citoyen"]}>
              <CitizenDashboardPage />
            </RoleRoute>
          }
        />
        <Route
          path="catalogue"
          element={
            <RoleRoute roles={["citoyen"]}>
              <CitizenCataloguePage />
            </RoleRoute>
          }
        />
        <Route
          path="demandes"
          element={
            <RoleRoute roles={["citoyen"]}>
              <CitizenRequestsPage />
            </RoleRoute>
          }
        />
        <Route
          path="demandes/nouvelle"
          element={
            <RoleRoute roles={["citoyen"]}>
              <NewRequestPage />
            </RoleRoute>
          }
        />
        <Route
          path="demandes/:id"
          element={
            <RoleRoute roles={["citoyen"]}>
              <RequestDetailPage />
            </RoleRoute>
          }
        />

        <Route
          path="agent/file"
          element={
            <RoleRoute roles={["agent"]}>
              <AgentQueuePage />
            </RoleRoute>
          }
        />
        <Route
          path="agent/demandes/:id"
          element={
            <RoleRoute roles={["agent"]}>
              <AgentInstructionPage />
            </RoleRoute>
          }
        />

        <Route
          path="validation/file"
          element={
            <RoleRoute roles={["validateur"]}>
              <ValidatorQueuePage />
            </RoleRoute>
          }
        />
        <Route
          path="validation/demandes/:id"
          element={
            <RoleRoute roles={["validateur"]}>
              <ValidatorReviewPage />
            </RoleRoute>
          }
        />

        <Route
          path="admin/tableau-de-bord"
          element={
            <RoleRoute roles={["admin"]}>
              <AdminDashboardPage />
            </RoleRoute>
          }
        />
        <Route
          path="admin/utilisateurs"
          element={
            <RoleRoute roles={["admin"]}>
              <AdminUsersPage />
            </RoleRoute>
          }
        />
        <Route
          path="admin/types-actes"
          element={
            <RoleRoute roles={["admin"]}>
              <AdminTypesPage />
            </RoleRoute>
          }
        />
        <Route
          path="admin/audit"
          element={
            <RoleRoute roles={["admin"]}>
              <AdminAuditPage />
            </RoleRoute>
          }
        />

        <Route path="profil" element={<ProfilePage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
