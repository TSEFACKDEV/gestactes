"""Scénario de bout en bout API.

Propriétaire : VOUMIA OUALA DILANE
TODO :
  [ ] Décommenter et compléter après implémentation des modules.
  [ ] Vérifier les commits GitHub simulés.
  [ ] Vérifier le PDF et le tag.
"""

import pytest


@pytest.mark.skip(reason="Scénario complet à activer en semaine 7")
def test_full_workflow(client, auth_headers, type_acte):
    """Citoyen -> agent -> validateur -> signature -> archive."""

    # 1. Créer une demande citoyen.
    # 2. Prendre en charge avec l'agent.
    # 3. Modifier et soumettre.
    # 4. Approuver et signer avec le validateur.
    # 5. Vérifier l'archive et la vérification publique.
    assert True
