"""Jeu de données de démonstration.

Propriétaire : VOUMIA OUALA DILANE
TODO :
  [ ] Ajouter des demandes fictives à différents états.
  [ ] Ajouter des pièces PDF d'exemple.
  [ ] Vérifier que le seed est idempotent.
"""

from typing import Any

from sqlmodel import Session, select

from app.core.config import settings
from app.core.security import hash_password
from app.db import engine, init_db
from app.models import Role, TypeActe, User

DEMO_USERS: list[dict[str, Any]] = [
    {
        "email": "citoyen@gestactes.com",
        "first_name": "Awa",
        "last_name": "Ndiaye",
        "role": Role.CITOYEN,
    },
    {
        "email": "agent@gestactes.com",
        "first_name": "Maxime",
        "last_name": "Leukam",
        "role": Role.AGENT,
    },
    {
        "email": "validateur@gestactes.com",
        "first_name": "Eunice",
        "last_name": "Nzeutem",
        "role": Role.VALIDATEUR,
    },
    {
        "email": "admin@gestactes.com",
        "first_name": "Calvin",
        "last_name": "Tsefack",
        "role": Role.ADMIN,
    },
]

DEMO_TYPES: list[dict[str, Any]] = [
    {
        "code": "attestation-residence",
        "label": "Attestation de résidence",
        "description": "Atteste du lieu de résidence du demandeur.",
        "form_schema": [
            {
                "name": "adresse",
                "label": "Adresse complète",
                "type": "textarea",
                "required": True,
                "placeholder": "12 rue des Lilas, 75000 Ville",
                "help": "Adresse actuelle du demandeur.",
            },
            {
                "name": "residence_depuis",
                "label": "Résident depuis",
                "type": "date",
                "required": True,
            },
            {
                "name": "motif",
                "label": "Motif de la demande",
                "type": "textarea",
                "required": False,
                "help": "Facultatif. Ex. : démarche administrative.",
            },
        ],
        "template_md": (
            "# Attestation de résidence\n\n"
            "Je soussigné(e), autorité compétente, atteste que "
            "**{{ demandeur.prenom }} {{ demandeur.nom }}** réside à "
            "l'adresse suivante : {{ donnees.adresse }}.\n\n"
            "Résidence depuis le : {{ donnees.residence_depuis }}.\n\n"
            "Numéro d'acte : **{{ numero }}**.\n"
        ),
    },
    {
        "code": "extrait-naissance",
        "label": "Extrait d'acte de naissance",
        "description": "Extrait simple d'acte de naissance.",
        "form_schema": [
            {
                "name": "date_naissance",
                "label": "Date de naissance",
                "type": "date",
                "required": True,
            },
            {
                "name": "lieu_naissance",
                "label": "Lieu de naissance",
                "type": "text",
                "required": True,
                "placeholder": "Douala",
            },
            {
                "name": "nom_pere",
                "label": "Nom du père",
                "type": "text",
                "required": False,
            },
            {
                "name": "nom_mere",
                "label": "Nom de la mère",
                "type": "text",
                "required": False,
            },
        ],
        "template_md": (
            "# Extrait d'acte de naissance\n\n"
            "**{{ demandeur.prenom }} {{ demandeur.nom }}**, né(e) le "
            "{{ donnees.date_naissance }} à {{ donnees.lieu_naissance }}.\n\n"
            "Numéro d'acte : **{{ numero }}**.\n"
        ),
    },
    {
        "code": "autorisation-administrative",
        "label": "Autorisation administrative",
        "description": "Autorisation simple pour une démarche administratives.",
        "form_schema": [
            {
                "name": "objet",
                "label": "Objet de l'autorisation",
                "type": "textarea",
                "required": True,
            },
            {
                "name": "date_debut",
                "label": "Date de début",
                "type": "date",
                "required": True,
            },
            {
                "name": "date_fin",
                "label": "Date de fin",
                "type": "date",
                "required": True,
            },
        ],
        "template_md": (
            "# Autorisation administrative\n\n"
            "Autorisation accordée à **{{ demandeur.prenom }} {{ demandeur.nom }}** "
            "pour l'objet suivant : {{ donnees.objet }}.\n\n"
            "Période : du {{ donnees.date_debut }} au {{ donnees.date_fin }}.\n\n"
            "Numéro d'acte : **{{ numero }}**.\n"
        ),
    },
]


def seed_all(session: Session) -> None:
    """Crée les comptes et types de démonstration s'ils manquent."""

    for item in DEMO_USERS:
        existing_user = session.exec(
            select(User).where(User.email == item["email"])
        ).first()
        if existing_user is None:
            session.add(
                User(
                    email=item["email"],
                    password_hash=hash_password(settings.seed_password),
                    first_name=item["first_name"],
                    last_name=item["last_name"],
                    role=item["role"],
                )
            )

    for item in DEMO_TYPES:
        existing_type = session.exec(
            select(TypeActe).where(TypeActe.code == item["code"])
        ).first()
        if existing_type is None:
            session.add(TypeActe(**item))

    session.commit()


if __name__ == "__main__":
    init_db()
    with Session(engine) as db_session:
        seed_all(db_session)
    print("Données de démonstration créées.")
