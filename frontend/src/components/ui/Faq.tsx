import { Icon } from "@/components/ui";

const QA: [string, string][] = [
  ["Qui peut vérifier un acte ?", "Toute personne, sans créer de compte. Il suffit du numéro de l'acte ou de son QR code."],
  ["Quelles informations sont affichées ?", "Le numéro, le type d'acte, la date de délivrance et le statut de signature. Aucun nom ni adresse n'apparaît, pour protéger les données personnelles."],
  ["Que signifie « Acte authentique » ?", "L'acte a été signé et archivé dans GestActes, et son contenu n'a pas été modifié depuis."],
  ["Le résultat indique « non vérifiable ». Que faire ?", "Contrôlez le numéro saisi (format ACTE-2026-00042). Si l'erreur persiste, le document ne provient peut-être pas de GestActes."],
  ["Quels actes puis-je demander ?", "Une attestation de résidence, un extrait d'acte de naissance et une autorisation administrative simple. Connectez-vous ou créez un compte citoyen pour déposer une demande."],
  ["La signature a-t-elle une valeur légale ?", "Non. GestActes est un projet pédagogique : la signature est simulée par une empreinte SHA-256 horodatée et toutes les données sont fictives."],
];

export function Faq() {
  return (
    <div className="faq">
      {QA.map(([q, a]) => (
        <details key={q}>
          <summary>{q}<Icon name="chevron" /></summary>
          <p>{a}</p>
        </details>
      ))}
    </div>
  );
}
