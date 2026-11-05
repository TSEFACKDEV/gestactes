import { Link } from "react-router-dom";
import { Icon } from "@/components/ui";

function Msg({ code, titre, texte }: { code: string; titre: string; texte: string }) {
  return (
    <div className="center-page">
      <div className="card" style={{ maxWidth: 460 }}>
        <div style={{ fontSize: "3rem", fontWeight: 800, color: "var(--ga-gold)", lineHeight: 1 }}>{code}</div>
        <h1 style={{ marginTop: ".5rem" }}>{titre}</h1><p style={{ color: "var(--ga-muted)" }}>{texte}</p>
        <Link className="btn btn--navy" to="/"><Icon name="home" /> Retour à l'accueil</Link>
      </div>
    </div>
  );
}
export const ForbiddenPage = () => <Msg code="403" titre="Accès refusé" texte="Votre rôle ne permet pas d'ouvrir cette page." />;
export const NotFoundPage = () => <Msg code="404" titre="Page introuvable" texte="L'adresse saisie n'existe pas ou a été déplacée." />;
