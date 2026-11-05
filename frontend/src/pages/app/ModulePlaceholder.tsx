/** Point d'insertion d'un module développé par un autre membre de l'équipe. */
export default function ModulePlaceholder({ titre, responsable }: { titre: string; responsable: string }) {
  return (
    <div className="card" style={{ maxWidth: 560 }}>
      <h2>{titre}</h2>
      <p>Ce module est développé par {responsable}. Il s'affichera ici, dans la coquille commune (menu, session, contrôle d'accès).</p>
    </div>
  );
}
