import { Link } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";

/** Emplacement provisoire : le vrai tableau de bord citoyen est développé par Audrey (parcours citoyen). */
export default function DashboardPage() {
  const { user } = useAuth();
  return (
    <>
      <div className="welcome">
        <h1>Bonjour, {user?.prenom} {user?.nom}</h1>
        <p>Bienvenue sur GestActes.</p>
      </div>
      <div className="quick">
        <Link className="btn btn--gold" to="/app/demandes">Faire une demande</Link>
        <Link className="btn btn--teal" to="/app/demandes">Suivre mes demandes</Link>
        <Link className="btn btn--ghost" to="/verifier">Vérifier un acte</Link>
      </div>
    </>
  );
}
