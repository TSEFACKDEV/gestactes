import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { GuestRoute, ProtectedRoute } from "@/auth/ProtectedRoute";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { AppLayout } from "@/components/layout/AppLayout";
import { Spinner } from "@/components/ui";
import { ForbiddenPage, NotFoundPage } from "@/pages/ErrorPages";
import ModulePlaceholder from "@/pages/app/ModulePlaceholder";

const HomePage = lazy(() => import("@/pages/public/HomePage"));
const VerifyPage = lazy(() => import("@/pages/public/VerifyPage"));
const VerifyResultPage = lazy(() => import("@/pages/public/VerifyResultPage"));
const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/auth/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/pages/auth/ResetPasswordPage"));
const DashboardPage = lazy(() => import("@/pages/app/DashboardPage"));
const RequestsPage = lazy(() => import("@/pages/app/RequestsPage"));
const RequestDetailPage = lazy(() => import("@/pages/app/RequestDetailPage"));
const ProfilePage = lazy(() => import("@/pages/app/ProfilePage"));

/** Remonte en haut à chaque changement de page, ou défile jusqu'à l'ancre (#faq). */
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
      return () => clearTimeout(t);
    }
    window.scrollTo({ top: 0 });
  }, [pathname, hash]);
  return null;
}

/**
 * Carte de navigation :
 *  Public      /  (accueil + FAQ #faq)  /verifier  /verifier/:numero
 *  Auth        /connexion  /inscription  /mot-de-passe-oublie  /reinitialiser
 *  Citoyen     /app  /app/demandes  /app/demandes/:id  /app/profil
 *  Agent /agent · Validateur /validateur · Admin /admin   (modules des autres membres)
 */
export default function App() {
  return (
    <Suspense fallback={<div className="center-page"><Spinner dark /></div>}>
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
          <Route element={<AppLayout />}><Route path="app/profil" element={<ProfilePage />} /></Route>
        </Route>
        <Route element={<ProtectedRoute roles={["citoyen"]} />}>
          <Route element={<AppLayout />}>
            <Route path="app" element={<DashboardPage />} />
            <Route path="app/demandes" element={<RequestsPage />} />
            <Route path="app/demandes/nouvelle" element={<ModulePlaceholder titre="Faire une demande" responsable="Audrey (parcours citoyen)" />} />
            <Route path="app/demandes/:id" element={<RequestDetailPage />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute roles={["agent"]} />}>
          <Route element={<AppLayout />}><Route path="agent" element={<ModulePlaceholder titre="File des demandes" responsable="Maxime (parcours agent)" />} /></Route>
        </Route>
        <Route element={<ProtectedRoute roles={["validateur"]} />}>
          <Route element={<AppLayout />}><Route path="validateur" element={<ModulePlaceholder titre="Actes à valider" responsable="l'équipe validateur" />} /></Route>
        </Route>
        <Route element={<ProtectedRoute roles={["administrateur"]} />}>
          <Route element={<AppLayout />}><Route path="admin" element={<ModulePlaceholder titre="Administration" responsable="l'équipe administration" />} /></Route>
        </Route>

        <Route path="acces-refuse" element={<ForbiddenPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
