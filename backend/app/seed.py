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
        "description": (
            "Atteste du lieu de résidence du demandeur dans la commune. "
            "Document délivré par la mairie ou le chef de quartier."
        ),
        "form_schema": [
            {
                "name": "arrondissement",
                "label": "Arrondissement",
                "type": "text",
                "required": True,
                "placeholder": "Douala 5e",
            },
            {
                "name": "quartier",
                "label": "Quartier",
                "type": "text",
                "required": True,
                "placeholder": "Bonamoussadi",
            },
            {
                "name": "adresse",
                "label": "Adresse complète",
                "type": "textarea",
                "required": True,
                "placeholder": "Rue, immeuble, repère, ville",
                "help": "Précisez un repère ou un point de référence.",
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
                "help": "Facultatif. Ex. : inscription scolaire, démarche administrative.",
            },
        ],
        "template_md": (
            "# Attestation de résidence\n\n"
            "Je soussigné(e), autorité compétente de la commune, atteste que "
            "**{{ demandeur.prenom }} {{ demandeur.nom }}** réside à "
            "l'adresse suivante : {{ donnees.adresse }}, "
            "quartier {{ donnees.quartier }}, arrondissement de "
            "{{ donnees.arrondissement }}.\n\n"
            "Résidence depuis le : {{ donnees.residence_depuis }}.\n\n"
            "Numéro d'acte : **{{ numero }}**.\n"
        ),
    },
    {
        "code": "extrait-naissance",
        "label": "Extrait d'acte de naissance",
        "description": (
            "Extrait d'acte de naissance délivré par un centre d'état civil. "
            "Il reprend les mentions de l'acte original."
        ),
        "form_schema": [
            {
                "name": "numero_acte_naissance",
                "label": "Numéro de l'acte de naissance",
                "type": "text",
                "required": True,
                "placeholder": "Ex. : 1234/1998",
            },
            {
                "name": "annee_acte",
                "label": "Année de l'acte",
                "type": "number",
                "required": True,
                "placeholder": "1998",
            },
            {
                "name": "centre_etat_civil",
                "label": "Centre d'état civil",
                "type": "text",
                "required": True,
                "placeholder": "Mairie de Douala 5e",
            },
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
                "name": "sexe",
                "label": "Sexe",
                "type": "select",
                "required": True,
                "options": [
                    {"value": "M", "label": "Masculin"},
                    {"value": "F", "label": "Féminin"},
                ],
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
            "{{ donnees.date_naissance }} à {{ donnees.lieu_naissance }},\n"
            "sexe : {{ donnees.sexe }}.\n\n"
            "Acte n° {{ donnees.numero_acte_naissance }} de l'année "
            "{{ donnees.annee_acte }}, centre d'état civil : "
            "{{ donnees.centre_etat_civil }}.\n\n"
            "Père : {{ donnees.nom_pere }}. Mère : {{ donnees.nom_mere }}.\n\n"
            "Numéro d'acte : **{{ numero }}**.\n"
        ),
    },
    {
        "code": "autorisation-batir",
        "label": "Autorisation de bâtir",
        "description": (
            "Autorisation municipale de construire ou de modifier un bâtiment. "
            "Elle précise la parcelle, la nature des travaux et la durée de validité."
        ),
        "form_schema": [
            {
                "name": "nature_travaux",
                "label": "Nature des travaux",
                "type": "textarea",
                "required": True,
                "placeholder": "Construction d'une maison d'habitation, clôture, extension...",
            },
            {
                "name": "adresse_parcelle",
                "label": "Adresse de la parcelle",
                "type": "textarea",
                "required": True,
                "placeholder": "Quartier, rue, repère",
            },
            {
                "name": "quartier",
                "label": "Quartier",
                "type": "text",
                "required": True,
                "placeholder": "Bonamoussadi",
            },
            {
                "name": "surface_terrain",
                "label": "Surface du terrain (m²)",
                "type": "number",
                "required": True,
                "placeholder": "500",
            },
            {
                "name": "numero_titre",
                "label": "Numéro de titre foncier",
                "type": "text",
                "required": False,
                "help": "Facultatif si le dossier est en cours de régularisation.",
            },
            {
                "name": "date_debut",
                "label": "Date de début des travaux",
                "type": "date",
                "required": True,
            },
            {
                "name": "duree_mois",
                "label": "Durée de validité (mois)",
                "type": "number",
                "required": True,
                "placeholder": "12",
            },
        ],
        "template_md": (
            "# Autorisation de bâtir\n\n"
            "Autorisation délivrée à **{{ demandeur.prenom }} {{ demandeur.nom }}** "
            "pour des travaux de {{ donnees.nature_travaux }}, sur la parcelle "
            "située à {{ donnees.adresse_parcelle }}, quartier "
            "{{ donnees.quartier }}.\n\n"
            "Surface du terrain : {{ donnees.surface_terrain }} m².\n"
            "Titre foncier : {{ donnees.numero_titre }}.\n"
            "Début des travaux : {{ donnees.date_debut }}.\n"
            "Validité : {{ donnees.duree_mois }} mois.\n\n"
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
