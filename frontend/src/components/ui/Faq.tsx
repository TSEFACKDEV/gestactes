import { Icon } from "@/components/ui";

const QA: [string, string][] = [
  [
    "Quels actes puis-je demander ?",
    "Une attestation de résidence, un extrait d'acte de naissance et une autorisation de bâtir. La commune peut ajouter d'autres modèles depuis l'administration.",
  ],
  [
    "Comment sont identifiés les actes ?",
    "Chaque acte reçoit un numéro unique : AR-2026-00042 pour une attestation de résidence, EN-2026-00042 pour un extrait d'acte de naissance, AB-2026-00042 pour une autorisation de bâtir. Ce numéro figure sur le document et dans le QR code.",
  ],
  [
    "Quelles pièces dois-je joindre ?",
    "Selon l'acte : justificatif de domicile, acte de naissance, plan de situation ou titre de propriété. Formats PDF, JPG ou PNG, 3 fichiers maximum, 5 Mo par fichier.",
  ],
  [
    "Combien de temps prend le traitement ?",
    "Le délai dépend de la commune et du type d'acte. Vous suivez chaque étape dans votre espace : dépôt, instruction, validation, signature et archivage.",
  ],
  [
    "Comment vérifier un acte ?",
    "Toute personne peut saisir le numéro de l'acte ou scanner son QR code sur la page de vérification. Le résultat affiche le type, la date et le signataire, sans aucune donnée personnelle.",
  ],
  [
    "La signature a-t-elle une valeur légale ?",
    "Non. GestActes est un projet pédagogique : la signature est simulée par une empreinte SHA-256 horodatée et toutes les données sont fictives.",
  ],
  [
    "Mes données sont-elles publiques ?",
    "Non. Le dépôt GitHub est privé, les données sont fictives et la vérification publique ne montre ni nom, ni adresse, ni date de naissance.",
  ],
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
