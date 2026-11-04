import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui";
import { useAuth } from "@/auth/AuthContext";
import { ROLE_LABEL } from "@/lib/roles";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;
  return (
    <div className="card" style={{ maxWidth: 520 }}>
      <h2>Profil</h2>
      <dl className="dl">
        <div><dt>Nom</dt><dd>{user.prenom} {user.nom}</dd></div>
        <div><dt>E-mail</dt><dd>{user.email}</dd></div>
        <div><dt>Rôle</dt><dd>{ROLE_LABEL[user.role]}</dd></div>
      </dl>
      <Button variant="navy" onClick={() => { logout(); navigate("/connexion"); }}>Se déconnecter</Button>
    </div>
  );
}
