"""Statistiques d'administration.

Propriétaire : KOUODZO ZANGUE REGINA
TODO :
  [ ] Optimiser avec des requêtes d'agrégation.
  [ ] Ajouter les filtres de période.
  [ ] Tester le calcul des délais.
"""

from sqlmodel import Session, select

from app.models import Demande, StatutDemande, TypeActe
from app.schemas.admin import StatsRead


def get_stats(session: Session) -> StatsRead:
    """Calcule les indicateurs du tableau de bord admin."""

    demandes = list(session.exec(select(Demande)).all())
    types = {type_acte.id: type_acte.code for type_acte in session.exec(select(TypeActe)).all()}

    par_statut: dict[str, int] = {statut.value: 0 for statut in StatutDemande}
    par_type: dict[str, int] = {}
    durees: list[float] = []

    for demande in demandes:
        par_statut[demande.statut.value] = par_statut.get(demande.statut.value, 0) + 1
        type_code = types.get(demande.type_acte_id, "inconnu")
        par_type[type_code] = par_type.get(type_code, 0) + 1
        if demande.signed_at is not None:
            delta = demande.signed_at - demande.created_at
            durees.append(delta.total_seconds() / 3600)

    moyenne = round(sum(durees) / len(durees), 1) if durees else 0.0

    return StatsRead(
        total=len(demandes),
        par_statut=par_statut,
        par_type=par_type,
        delai_moyen_heures=moyenne,
    )
