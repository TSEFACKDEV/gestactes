#!/usr/bin/env bash
# Crée les labels GitHub du projet GestActes.
# Propriétaire : TSEFACK CALVIN KLEIN
# Usage : ./scripts/setup-github.sh [owner/repo]
set -euo pipefail

REPO="${1:-}"
if [ -z "$REPO" ]; then
  REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
fi

echo "Configuration des labels pour ${REPO}"

create_label() {
  gh label create "$1" --repo "$REPO" --color "$2" --description "$3" --force >/dev/null
  echo "  $1"
}

create_label "statut:demandee" "B7791F" "Demande déposée"
create_label "statut:en-instruction" "4A6FA5" "Instruction en cours"
create_label "statut:en-validation" "7C5CBF" "En attente de validation"
create_label "statut:validee" "3F7D5A" "Validée"
create_label "statut:signee" "2F6F68" "Signée"
create_label "statut:archivee" "4B5563" "Archivée"
create_label "statut:rejetee" "B45151" "Rejetée"
create_label "statut:annulee" "6B7280" "Annulée"
create_label "type:attestation-residence" "C9A66B" "Attestation de résidence"
create_label "type:extrait-naissance" "C9A66B" "Extrait d'acte de naissance"
create_label "type:autorisation-administrative" "C9A66B" "Autorisation administrative"
create_label "complement:attendu" "B7791F" "Complément demandé au citoyen"
create_label "priorite:haute" "B45151" "Priorité haute"
create_label "priorite:moyenne" "B7791F" "Priorité moyenne"
create_label "priorite:basse" "6B7280" "Priorité basse"
create_label "aide" "4A6FA5" "Demande d'aide ou de déblocage"
create_label "bug" "B45151" "Comportement incorrect"

echo "Labels créés. Configurer ensuite les protections de branches (voir docs/github-setup.md)."
