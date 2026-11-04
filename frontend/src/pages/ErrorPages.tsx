import { Link } from "react-router-dom";

export function ForbiddenPage() {
  return (
    <div className="center-page"><div className="card" style={{ maxWidth: 440 }}>
      <h1>Accès refusé (403)</h1>
      <p>Votre rôle ne permet pas d'ouvrir cette page.</p>
      <Link className="btn btn--navy" to="/">Retour à l'accueil</Link>
    </div></div>
  );
}
export function NotFoundPage() {
  return (
    <div className="center-page"><div className="card" style={{ maxWidth: 440 }}>
      <h1>Page introuvable (404)</h1>
      <p>L'adresse saisie n'existe pas.</p>
      <Link className="btn btn--navy" to="/">Retour à l'accueil</Link>
    </div></div>
  );
}
