/**
 * Routage principal.
 * Propriétaire : TSEFACK CALVIN KLEIN (intégration).
 * TODO : maintenir les routes et les protections par rôle.
 */

import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { GuestRoute, ProtectedRoute } from "@/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Spinner } from "@/components/ui";
import { AdminAuditPage } from "@/features/admin/pages/AuditPage";
import { AdminDashboardPage } from "@/features/admin/pages/DashboardPage";
import { AdminTypesPage } from "@/features/admin/pages/TypesPage";
import { AdminUsersPage } from "@/features/admin/pages/UsersPage";
import { AgentInstructionPage } from "@/features/agent/pages/InstructionPage";
import { AgentQueuePage } from "@/features/agent/pages/QueuePage";
import { NewRequestPage } from "@/features/citizen/pages/NewRequestPage";
import { RequestDetailPage } from "@/features/citizen/pages/RequestDetailPage";
import { NotificationsPage } from "@/features/shared/pages/NotificationsPage";
import { ValidatorQueuePage } from "@/features/validator/pages/QueuePage";
import { ValidatorReviewPage } from "@/features/validator/pages/ReviewPage";
import { ForbiddenPage, NotFoundPage } from "@/pages/ErrorPages";

const HomePage = lazy(() => import("@/pages/public/HomePage"));
const VerifyPage = lazy(() => import("@/pages/public/VerifyPage"));
const VerifyResultPage = lazy(() => import("@/pages/public/VerifyResultPage"));
const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/auth/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/pages/auth/ResetPasswordPage"));
const DashboardPage = lazy(() => import("@/pages/app/DashboardPage"));
const RequestsPage = lazy(() => import("@/pages/app/RequestsPage"));
const ProfilePage = lazy(() => import("@/pages/app/ProfilePage"));

function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const timeout = setTimeout(
        () =>
          document
            .getElementById(hash.slice(1))
            ?.scrollIntoView({ behavior: "smooth", block: "start" }),
        60,
      );
      return () => clearTimeout(timeout);
    }
    window.scrollTo({ top: 0 });
  }, [pathname, hash]);
  return null;
}

export default function App() {
  return (
    <Suspense
      fallback={
        <div className="center-page">
          <Spinner dark />
        </div>
      }
    >
      <ScrollManager />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="verifier" element={<VerifyPage />} />
          <Route path="verifier/:numero" element={<VerifyResultPage />} />
        </Route>
        <Route path="faq" element={<Navigate to="/#faq" replace />} />

        <Route element={<GuestRoute />}>
          <Route element={<AuthLayout />}>
            <Route path="connexion" element={<LoginPage />} />
            <Route path="inscription" element={<RegisterPage />} />
            <Route path="mot-de-passe-oublie" element={<ForgotPasswordPage />} />
            <Route path="reinitialiser" element={<ResetPasswordPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="app/profil" element={<ProfilePage />} />
            <Route path="app/notifications" element={<NotificationsPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute roles={["citoyen"]} />}>
          <Route element={<AppLayout />}>
            <Route path="app" element={<DashboardPage />} />
            <Route path="app/demandes" element={<RequestsPage />} />
            <Route path="app/demandes/nouvelle" element={<NewRequestPage />} />
            <Route path="app/demandes/:id" element={<RequestDetailPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute roles={["agent"]} />}>
          <Route element={<AppLayout />}>
            <Route path="app/agent/file" element={<AgentQueuePage />} />
            <Route path="app/agent/demandes/:id" element={<AgentInstructionPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute roles={["validateur"]} />}>
          <Route element={<AppLayout />}>
            <Route path="app/validation/file" element={<ValidatorQueuePage />} />
            <Route
              path="app/validation/demandes/:id"
              element={<ValidatorReviewPage />}
            />
          </Route>
        </Route>

        <Route element={<ProtectedRoute roles={["admin"]} />}>
          <Route element={<AppLayout />}>
            <Route
              path="app/admin/tableau-de-bord"
              element={<AdminDashboardPage />}
            />
            <Route path="app/admin/utilisateurs" element={<AdminUsersPage />} />
            <Route path="app/admin/types-actes" element={<AdminTypesPage />} />
            <Route path="app/admin/audit" element={<AdminAuditPage />} />
          </Route>
        </Route>

        <Route path="acces-refuse" element={<ForbiddenPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
