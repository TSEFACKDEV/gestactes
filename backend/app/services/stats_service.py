"""Statistiques d'administration.

Propriétaire : KOUODZO ZANGUE REGINA
Rôle : indicateurs du tableau de bord admin (total, par statut, par type, délai
moyen de traitement).

Les comptages sont faits par la base (GROUP BY) ; seules deux colonnes de date
sont lues pour calculer le délai moyen, ce calcul étant différent d'un SGBD à
l'autre. Le délai moyen porte sur les demandes signées : durée entre la création
de la demande et sa signature.

Un filtre de période optionnel porte sur la date de création de la demande
(bornes inclusives, en UTC).
"""

from datetime import UTC, date, datetime, time, timedelta
from typing import Any

from sqlalchemy import func
from sqlmodel import Session, col, select

from app.models import Demande, StatutDemande, TypeActe
from app.schemas.admin import StatsRead
from app.services.audit_service import ensure_utc


def _period_conditions(date_from: date | None, date_to: date | None) -> list[Any]:
    conditions: list[Any] = []
    if date_from is not None:
        conditions.append(Demande.created_at >= datetime.combine(date_from, time.min, tzinfo=UTC))
    if date_to is not None:
        conditions.append(
            Demande.created_at < datetime.combine(date_to + timedelta(days=1), time.min, tzinfo=UTC)
        )
    return conditions


def get_stats(
    session: Session,
    *,
    date_from: date | None = None,
    date_to: date | None = None,
) -> StatsRead:
    """Calcule les indicateurs du tableau de bord admin."""

    conditions = _period_conditions(date_from, date_to)

    # Par statut : tous les statuts sont présents, même à zéro.
    par_statut: dict[str, int] = {statut.value: 0 for statut in StatutDemande}
    statut_query = select(Demande.statut, func.count()).group_by(Demande.statut)
    for condition in conditions:
        statut_query = statut_query.where(condition)
    for statut, count in session.exec(statut_query).all():
        key = statut.value if isinstance(statut, StatutDemande) else str(statut)
        par_statut[key] = int(count)

    # Par type : code du type, « inconnu » si le type a disparu.
    par_type: dict[str, int] = {}
    type_query = (
        select(TypeActe.code, func.count())
        .select_from(Demande)
        .join(TypeActe, col(TypeActe.id) == col(Demande.type_acte_id), isouter=True)
        .group_by(TypeActe.code)
    )
    for condition in conditions:
        type_query = type_query.where(condition)
    for code, count in session.exec(type_query).all():
        key = code or "inconnu"
        par_type[key] = par_type.get(key, 0) + int(count)

    # Délai moyen : création -> signature, en heures.
    delay_query = select(Demande.created_at, Demande.signed_at).where(
        col(Demande.signed_at).is_not(None)
    )
    for condition in conditions:
        delay_query = delay_query.where(condition)
    durations = [
        (ensure_utc(signed_at) - ensure_utc(created_at)).total_seconds() / 3600
        for created_at, signed_at in session.exec(delay_query).all()
        if signed_at is not None
    ]
    moyenne = round(sum(durations) / len(durations), 1) if durations else 0.0

    return StatsRead(
        total=sum(par_statut.values()),
        par_statut=par_statut,
        par_type=par_type,
        delai_moyen_heures=moyenne,
    )
