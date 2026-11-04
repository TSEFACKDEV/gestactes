import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { GuestRoute, ProtectedRoute } from "@/auth/ProtectedRoute";
import { PublicLayout } from "@/layouts/PublicLayout";
import { AuthLayout } from "@/layouts/AuthLayout";
import { AppLayout } from "@/layouts/AppLayout";
import { Spinner } from "@/components/ui";
import { ForbiddenPage, NotFoundPage } from "@/pages/ErrorPages";
import ModulePlaceholder from "@/pages/app/ModulePlaceholder";

const HomePage = lazy(() => import("@/pages/public/HomePage"));
const FaqPage = lazy(() => import("@/pages/public/FaqPage"));
const VerifyPage = lazy(() => import("@/pages/public/VerifyPage"));
const VerifyResultPage = lazy(() => import("@/pages/public/VerifyResultPage"));
const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/auth/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/pages/auth/ResetPasswordPage"));
const DashboardPage = lazy(() => import("@/pages/app/DashboardPage"));
const ProfilePage = lazy(() => import("@/pages/app/ProfilePage"));

/**
 * Carte de navigation :
 *  Public      /  /verifier  /verifier/:numero  /faq
 *  Auth        /connexion  /inscription  /mot-de-passe-oublie  /reinitialiser
 *  Citoyen     /app  /app/demandes  /app/profil        (Audrey : parcours citoyen)
 *  Agent       /agent                                  (Maxime : parcours agent)
 *  Validateur  /validateur                             (module validateur)
 *  Admin       /admin                                  (module administration)
 */
export default function App() {
  return (
    <Suspense fallback={<div className="center-page"><Spinner dark /></div>}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="verifier" element={<VerifyPage />} />
          <Route path="verifier/:numero" element={<VerifyResultPage />} />
          <Route path="faq" element={<FaqPage />} />
        </Route>

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
          </Route>
        </Route>
        <Route element={<ProtectedRoute roles={["citoyen"]} />}>
          <Route element={<AppLayout />}>
            <Route path="app" element={<DashboardPage />} />
            <Route path="app/demandes" element={<ModulePlaceholder titre="Mes demandes" responsable="Audrey (parcours citoyen)" />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute roles={["agent"]} />}>
          <Route element={<AppLayout />}>
            <Route path="agent" element={<ModulePlaceholder titre="File des demandes" responsable="Maxime (parcours agent)" />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute roles={["validateur"]} />}>
          <Route element={<AppLayout />}>
            <Route path="validateur" element={<ModulePlaceholder titre="Actes à valider" responsable="l'équipe validateur" />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute roles={["administrateur"]} />}>
          <Route element={<AppLayout />}>
            <Route path="admin" element={<ModulePlaceholder titre="Administration" responsable="l'équipe administration" />} />
          </Route>
        </Route>

        <Route path="acces-refuse" element={<ForbiddenPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
