const QA = [
  ["Qui peut vérifier un acte ?", "Toute personne, sans compte. Il suffit du numéro de l'acte ou de son QR code."],
  ["Quelles informations sont affichées ?", "Le numéro, le type d'acte, la date de délivrance et le statut de signature. Aucun nom ni adresse n'est affiché, pour protéger les données personnelles."],
  ["Que signifie « Acte authentique » ?", "L'acte a été signé et archivé dans GestActes, et son contenu n'a pas été modifié depuis."],
  ["Le résultat indique « non vérifiable ». Que faire ?", "Vérifiez le numéro saisi (format ACTE-2026-00042). Si l'erreur persiste, le document peut ne pas provenir de GestActes."],
  ["La signature a-t-elle une valeur légale ?", "Non. GestActes est un projet pédagogique : la signature est simulée et toutes les données sont fictives."],
];
export default function FaqPage() {
  return (
    <section className="section" style={{ maxWidth: 760 }}>
      <h1>Questions fréquentes</h1>
      {QA.map(([q, a]) => (
        <details key={q} className="card" style={{ marginBottom: ".75rem" }}>
          <summary style={{ fontWeight: 700, color: "var(--ga-navy)", cursor: "pointer" }}>{q}</summary>
          <p style={{ margin: ".75rem 0 0" }}>{a}</p>
        </details>
      ))}
    </section>
  );
}
