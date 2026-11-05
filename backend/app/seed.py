"""Jeu de données de démonstration.

Propriétaire : VOUMIA OUALA DILANE
Le seed est déterministe et idempotent : les comptes, les types d'actes, les
demandes, les pièces, l'audit et les notifications sont créés une seule fois.
Il peut être rejoué sans dupliquer les données existantes.

Les numéros de démonstration utilisent une plage réservée (000101 à 000109)
pour rester stables même si la base contient déjà des demandes créées par
l'application.

TODO :
  [x] Ajouter des demandes fictives à différents états.
  [x] Ajouter des pièces PDF d'exemple.
  [x] Vérifier que le seed est idempotent.
"""

import hashlib
import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from sqlmodel import Session, select

from app.core.config import settings
from app.core.security import hash_password
from app.db import engine, init_db
from app.models import (
    AuditEvent,
    Demande,
    Notification,
    PieceJointe,
    Role,
    StatutDemande,
    TypeActe,
    User,
)

SEED_DATA_DIR = Path(__file__).resolve().parent / "seed_data"
DEMO_PIECES_DIR = SEED_DATA_DIR / "pieces"


def _dt(
    year: int,
    month: int,
    day: int,
    hour: int = 9,
    minute: int = 0,
) -> datetime:
    """Date UTC fixe, pour que le jeu de données reste identique partout."""

    return datetime(year, month, day, hour, minute, tzinfo=UTC)


def _sha256_json(value: Any) -> str:
    """Empreinte canonique, identique à celle utilisée par la signature."""

    payload = json.dumps(
        value,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
        allow_nan=False,
    ).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def _sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _fake_sha(value: str) -> str:
    """Empreinte déterministe de 40 caractères pour les commits de démo."""

    return hashlib.sha1(value.encode("utf-8")).hexdigest()

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


def _residence_md(numero: str, donnees: dict[str, Any]) -> str:
    return (
        "# Attestation de résidence\n\n"
        "Je soussigné(e), autorité compétente de la commune, atteste que "
        "**Awa Ndiaye** réside à l'adresse suivante : "
        f"{donnees['adresse']}, quartier {donnees['quartier']}, "
        f"arrondissement de {donnees['arrondissement']}.\n\n"
        f"Résidence depuis le : {donnees['residence_depuis']}.\n\n"
        f"Numéro d'acte : **{numero}**.\n"
    )


def _naissance_md(numero: str, donnees: dict[str, Any]) -> str:
    return (
        "# Extrait d'acte de naissance\n\n"
        "**Awa Ndiaye**, née le "
        f"{donnees['date_naissance']} à {donnees['lieu_naissance']}, "
        f"sexe : {donnees['sexe']}.\n\n"
        f"Acte n° {donnees['numero_acte_naissance']} de l'année "
        f"{donnees['annee_acte']}, centre d'état civil : "
        f"{donnees['centre_etat_civil']}.\n\n"
        f"Père : {donnees['nom_pere']}. Mère : {donnees['nom_mere']}.\n\n"
        f"Numéro d'acte : **{numero}**.\n"
    )


def _batir_md(numero: str, donnees: dict[str, Any]) -> str:
    return (
        "# Autorisation de bâtir\n\n"
        "Autorisation délivrée à **Awa Ndiaye** pour des travaux de "
        f"{donnees['nature_travaux']}, sur la parcelle située à "
        f"{donnees['adresse_parcelle']}, quartier {donnees['quartier']}.\n\n"
        f"Surface du terrain : {donnees['surface_terrain']} m².\n"
        f"Titre foncier : {donnees['numero_titre']}.\n"
        f"Début des travaux : {donnees['date_debut']}.\n"
        f"Validité : {donnees['duree_mois']} mois.\n\n"
        f"Numéro d'acte : **{numero}**.\n"
    )


DEMO_DEMANDES: list[dict[str, Any]] = [
    {
        "numero": "AR-2026-000101",
        "type_code": "attestation-residence",
        "statut": StatutDemande.DEMANDEE,
        "created_at": _dt(2026, 11, 3, 8, 45),
        "donnees": {
            "arrondissement": "Douala 5e",
            "quartier": "Bonamoussadi",
            "adresse": "Rue des Palmiers, immeuble Akwa, Douala",
            "residence_depuis": "2021-03-01",
            "motif": "Inscription scolaire de mon enfant.",
        },
        "pieces": ["AR-2026-000101_justificatif-domicile.pdf"],
        "timeline": [
            ("creation", "citoyen@gestactes.com", _dt(2026, 11, 3, 8, 45), {"to": "demandee"}),
        ],
    },
    {
        "numero": "EN-2026-000102",
        "type_code": "extrait-naissance",
        "statut": StatutDemande.EN_INSTRUCTION,
        "created_at": _dt(2026, 10, 30, 10, 20),
        "assigned_agent": "agent@gestactes.com",
        "branch_name": "acte/EN-2026-000102",
        "donnees": {
            "numero_acte_naissance": "1234/1998",
            "annee_acte": 1998,
            "centre_etat_civil": "Mairie de Douala 5e",
            "date_naissance": "1998-06-14",
            "lieu_naissance": "Douala",
            "sexe": "F",
            "nom_pere": "Ndiaye Paul",
            "nom_mere": "Mbarga Jeanne",
        },
        "pieces": ["EN-2026-000102_ancien-acte-naissance.pdf"],
        "timeline": [
            ("creation", "citoyen@gestactes.com", _dt(2026, 10, 30, 10, 20), {"to": "demandee"}),
            (
                "prendre_en_charge",
                "agent@gestactes.com",
                _dt(2026, 10, 30, 12, 5),
                {"from": "demandee", "to": "en_instruction", "branch_name": "acte/EN-2026-000102"},
            ),
        ],
    },
    {
        "numero": "AB-2026-000103",
        "type_code": "autorisation-batir",
        "statut": StatutDemande.EN_VALIDATION,
        "created_at": _dt(2026, 10, 24, 9, 0),
        "assigned_agent": "agent@gestactes.com",
        "branch_name": "acte/AB-2026-000103",
        "donnees": {
            "nature_travaux": "Construction d'une maison d'habitation de type R+1",
            "adresse_parcelle": "Rue des Écoles, Bonamoussadi, Douala",
            "quartier": "Bonamoussadi",
            "surface_terrain": 500,
            "numero_titre": "TF-1234/DLA",
            "date_debut": "2026-12-01",
            "duree_mois": 12,
        },
        "pieces": [
            "AB-2026-000103_plan-de-masse.pdf",
            "AB-2026-000103_titre-foncier.pdf",
        ],
        "timeline": [
            ("creation", "citoyen@gestactes.com", _dt(2026, 10, 24, 9, 0), {"to": "demandee"}),
            (
                "prendre_en_charge",
                "agent@gestactes.com",
                _dt(2026, 10, 24, 9, 30),
                {"from": "demandee", "to": "en_instruction", "branch_name": "acte/AB-2026-000103"},
            ),
            (
                "soumettre",
                "agent@gestactes.com",
                _dt(2026, 10, 25, 14, 10),
                {"from": "en_instruction", "to": "en_validation", "comment": "Dossier complet."},
            ),
        ],
    },
    {
        "numero": "AR-2026-000104",
        "type_code": "attestation-residence",
        "statut": StatutDemande.VALIDEE,
        "created_at": _dt(2026, 10, 15, 11, 30),
        "assigned_agent": "agent@gestactes.com",
        "assigned_validator": "validateur@gestactes.com",
        "branch_name": "acte/AR-2026-000104",
        "donnees": {
            "arrondissement": "Douala 5e",
            "quartier": "Makepe",
            "adresse": "Rue du Marché, Makepe, Douala",
            "residence_depuis": "2019-09-01",
            "motif": "Ouverture de compte bancaire.",
        },
        "pieces": ["AR-2026-000104_justificatif-domicile.pdf"],
        "timeline": [
            ("creation", "citoyen@gestactes.com", _dt(2026, 10, 15, 11, 30), {"to": "demandee"}),
            (
                "prendre_en_charge",
                "agent@gestactes.com",
                _dt(2026, 10, 15, 12, 0),
                {"from": "demandee", "to": "en_instruction", "branch_name": "acte/AR-2026-000104"},
            ),
            (
                "soumettre",
                "agent@gestactes.com",
                _dt(2026, 10, 16, 9, 15),
                {"from": "en_instruction", "to": "en_validation", "comment": "Pièces vérifiées."},
            ),
            (
                "approuver",
                "validateur@gestactes.com",
                _dt(2026, 10, 18, 15, 40),
                {"from": "en_validation", "to": "validee", "comment": "Conforme."},
            ),
        ],
    },
    {
        "numero": "EN-2026-000105",
        "type_code": "extrait-naissance",
        "statut": StatutDemande.SIGNEE,
        "created_at": _dt(2026, 10, 5, 8, 15),
        "assigned_agent": "agent@gestactes.com",
        "assigned_validator": "validateur@gestactes.com",
        "branch_name": "acte/EN-2026-000105",
        "donnees": {
            "numero_acte_naissance": "5678/1998",
            "annee_acte": 1998,
            "centre_etat_civil": "Mairie de Douala 5e",
            "date_naissance": "1998-06-14",
            "lieu_naissance": "Douala",
            "sexe": "F",
            "nom_pere": "Ndiaye Paul",
            "nom_mere": "Mbarga Jeanne",
        },
        "pieces": ["EN-2026-000105_cni.pdf"],
        "signed_at": _dt(2026, 10, 9, 14, 40),
        "timeline": [
            ("creation", "citoyen@gestactes.com", _dt(2026, 10, 5, 8, 15), {"to": "demandee"}),
            (
                "prendre_en_charge",
                "agent@gestactes.com",
                _dt(2026, 10, 5, 11, 0),
                {"from": "demandee", "to": "en_instruction", "branch_name": "acte/EN-2026-000105"},
            ),
            (
                "soumettre",
                "agent@gestactes.com",
                _dt(2026, 10, 6, 10, 30),
                {"from": "en_instruction", "to": "en_validation", "comment": "Acte rédigé."},
            ),
            (
                "approuver",
                "validateur@gestactes.com",
                _dt(2026, 10, 8, 16, 0),
                {"from": "en_validation", "to": "validee", "comment": "Validé."},
            ),
            (
                "signer",
                "validateur@gestactes.com",
                _dt(2026, 10, 9, 14, 40),
                {"from": "validee", "to": "signee"},
            ),
        ],
    },
    {
        "numero": "AB-2026-000106",
        "type_code": "autorisation-batir",
        "statut": StatutDemande.ARCHIVEE,
        "created_at": _dt(2026, 9, 18, 9, 10),
        "assigned_agent": "agent@gestactes.com",
        "assigned_validator": "validateur@gestactes.com",
        "branch_name": "acte/AB-2026-000106",
        "donnees": {
            "nature_travaux": "Extension d'une maison d'habitation",
            "adresse_parcelle": "Rue de la Paix, Makepe, Douala",
            "quartier": "Makepe",
            "surface_terrain": 350,
            "numero_titre": "TF-5678/DLA",
            "date_debut": "2026-10-15",
            "duree_mois": 6,
        },
        "pieces": ["AB-2026-000106_plan-de-masse.pdf"],
        "signed_at": _dt(2026, 9, 25, 16, 20),
        "archived_at": _dt(2026, 9, 26, 9, 0),
        "timeline": [
            ("creation", "citoyen@gestactes.com", _dt(2026, 9, 18, 9, 10), {"to": "demandee"}),
            (
                "prendre_en_charge",
                "agent@gestactes.com",
                _dt(2026, 9, 18, 9, 45),
                {"from": "demandee", "to": "en_instruction", "branch_name": "acte/AB-2026-000106"},
            ),
            (
                "soumettre",
                "agent@gestactes.com",
                _dt(2026, 9, 19, 11, 20),
                {"from": "en_instruction", "to": "en_validation", "comment": "Dossier complet."},
            ),
            (
                "approuver",
                "validateur@gestactes.com",
                _dt(2026, 9, 21, 10, 5),
                {"from": "en_validation", "to": "validee", "comment": "Conforme."},
            ),
            (
                "signer",
                "validateur@gestactes.com",
                _dt(2026, 9, 25, 16, 20),
                {"from": "validee", "to": "signee"},
            ),
            ("archiver", None, _dt(2026, 9, 26, 9, 0), {"from": "signee", "to": "archivee"}),
        ],
    },
    {
        "numero": "AR-2026-000107",
        "type_code": "attestation-residence",
        "statut": StatutDemande.REJETEE,
        "created_at": _dt(2026, 10, 20, 13, 25),
        "assigned_agent": "agent@gestactes.com",
        "branch_name": "acte/AR-2026-000107",
        "donnees": {
            "arrondissement": "Douala 5e",
            "quartier": "Bonapriso",
            "adresse": "Rue Njo-Njo, Bonapriso, Douala",
            "residence_depuis": "2020-01-15",
            "motif": "Démarche administrative.",
        },
        "pieces": ["AR-2026-000107_justificatif-domicile.pdf"],
        "rejection_reason": (
            "Le justificatif de domicile est illisible. Merci de déposer une pièce datée "
            "de moins de trois mois."
        ),
        "timeline": [
            ("creation", "citoyen@gestactes.com", _dt(2026, 10, 20, 13, 25), {"to": "demandee"}),
            (
                "prendre_en_charge",
                "agent@gestactes.com",
                _dt(2026, 10, 20, 14, 0),
                {"from": "demandee", "to": "en_instruction", "branch_name": "acte/AR-2026-000107"},
            ),
            (
                "soumettre",
                "agent@gestactes.com",
                _dt(2026, 10, 21, 10, 10),
                {"from": "en_instruction", "to": "en_validation", "comment": "À vérifier."},
            ),
            (
                "rejeter",
                "validateur@gestactes.com",
                _dt(2026, 10, 22, 9, 30),
                {
                    "from": "en_validation",
                    "to": "rejetee",
                    "comment": "Justificatif illisible.",
                },
            ),
        ],
    },
    {
        "numero": "EN-2026-000108",
        "type_code": "extrait-naissance",
        "statut": StatutDemande.ANNULEE,
        "created_at": _dt(2026, 11, 1, 16, 5),
        "donnees": {
            "numero_acte_naissance": "9012/1998",
            "annee_acte": 1998,
            "centre_etat_civil": "Mairie de Douala 5e",
            "date_naissance": "1998-06-14",
            "lieu_naissance": "Douala",
            "sexe": "F",
            "nom_pere": "Ndiaye Paul",
            "nom_mere": "Mbarga Jeanne",
        },
        "pieces": [],
        "timeline": [
            ("creation", "citoyen@gestactes.com", _dt(2026, 11, 1, 16, 5), {"to": "demandee"}),
            ("annuler", "citoyen@gestactes.com", _dt(2026, 11, 2, 8, 20), {"from": "demandee", "to": "annulee"}),
        ],
    },
    {
        "numero": "AB-2026-000109",
        "type_code": "autorisation-batir",
        "statut": StatutDemande.EN_INSTRUCTION,
        "created_at": _dt(2026, 10, 27, 10, 0),
        "assigned_agent": "agent@gestactes.com",
        "branch_name": "acte/AB-2026-000109",
        "complement_attendu": True,
        "complement_message": "Merci de joindre le plan de situation signé par le géomètre.",
        "donnees": {
            "nature_travaux": "Construction d'un garage et d'une clôture",
            "adresse_parcelle": "Rue des Palmiers, Bonamoussadi, Douala",
            "quartier": "Bonamoussadi",
            "surface_terrain": 220,
            "numero_titre": "",
            "date_debut": "2026-12-15",
            "duree_mois": 6,
        },
        "pieces": ["AB-2026-000109_plan-de-masse.pdf"],
        "timeline": [
            ("creation", "citoyen@gestactes.com", _dt(2026, 10, 27, 10, 0), {"to": "demandee"}),
            (
                "prendre_en_charge",
                "agent@gestactes.com",
                _dt(2026, 10, 27, 11, 15),
                {"from": "demandee", "to": "en_instruction", "branch_name": "acte/AB-2026-000109"},
            ),
            (
                "complement",
                "agent@gestactes.com",
                _dt(2026, 10, 28, 9, 40),
                {
                    "from": "en_instruction",
                    "to": "en_instruction",
                    "message": "Merci de joindre le plan de situation signé par le géomètre.",
                },
            ),
        ],
    },
]


DEMO_NOTIFICATIONS: list[dict[str, Any]] = [
    {
        "email": "citoyen@gestactes.com",
        "numero": "AR-2026-000101",
        "title": "Demande déposée",
        "message": "Votre demande AR-2026-000101 a bien été enregistrée.",
        "is_read": True,
        "created_at": _dt(2026, 11, 3, 8, 45),
    },
    {
        "email": "agent@gestactes.com",
        "numero": "AR-2026-000101",
        "title": "Nouvelle demande à instruire",
        "message": "Une attestation de résidence attend une prise en charge.",
        "is_read": False,
        "created_at": _dt(2026, 11, 3, 8, 46),
    },
    {
        "email": "citoyen@gestactes.com",
        "numero": "EN-2026-000102",
        "title": "Demande prise en charge",
        "message": "Votre demande EN-2026-000102 est en cours d'instruction.",
        "is_read": False,
        "created_at": _dt(2026, 10, 30, 12, 5),
    },
    {
        "email": "validateur@gestactes.com",
        "numero": "AB-2026-000103",
        "title": "Acte à valider",
        "message": "L'autorisation de bâtir AB-2026-000103 attend votre décision.",
        "is_read": False,
        "created_at": _dt(2026, 10, 25, 14, 10),
    },
    {
        "email": "citoyen@gestactes.com",
        "numero": "AR-2026-000104",
        "title": "Demande validée",
        "message": "Votre attestation AR-2026-000104 a été validée.",
        "is_read": False,
        "created_at": _dt(2026, 10, 18, 15, 40),
    },
    {
        "email": "citoyen@gestactes.com",
        "numero": "EN-2026-000105",
        "title": "Acte signé disponible",
        "message": "Votre extrait d'acte de naissance EN-2026-000105 est signé.",
        "is_read": False,
        "created_at": _dt(2026, 10, 9, 14, 40),
    },
    {
        "email": "citoyen@gestactes.com",
        "numero": "AB-2026-000106",
        "title": "Acte archivé",
        "message": "Votre autorisation AB-2026-000106 est archivée et vérifiable.",
        "is_read": True,
        "created_at": _dt(2026, 9, 26, 9, 0),
    },
    {
        "email": "citoyen@gestactes.com",
        "numero": "AR-2026-000107",
        "title": "Demande rejetée",
        "message": "Votre demande AR-2026-000107 a été rejetée. Consultez le motif.",
        "is_read": False,
        "created_at": _dt(2026, 10, 22, 9, 30),
    },
    {
        "email": "citoyen@gestactes.com",
        "numero": "AB-2026-000109",
        "title": "Complément demandé",
        "message": "Un justificatif complémentaire est attendu pour AB-2026-000109.",
        "is_read": False,
        "created_at": _dt(2026, 10, 28, 9, 40),
    },
]




def _build_signature(
    numero: str,
    donnees: dict[str, Any],
    acte_md: str,
    validator: User,
    signed_at: datetime,
) -> dict[str, Any]:
    """Construit un manifeste de signature cohérent avec les données seedées."""

    return {
        "numero": numero,
        "sha256_acte_json": _sha256_json(donnees),
        "sha256_acte_md": _sha256_text(acte_md),
        "signataire": {
            "id": validator.id,
            "nom": validator.last_name,
            "prenom": validator.first_name,
            "role": validator.role.value,
        },
        "signe_le": signed_at.isoformat(),
        "algorithme": "SHA-256",
        "version": 1,
    }


def _acte_md_for(item: dict[str, Any]) -> str | None:
    """Rédige le contenu de démonstration selon le type et l'avancement."""

    if item["statut"] in {StatutDemande.DEMANDEE, StatutDemande.ANNULEE}:
        return None
    if item["type_code"] == "attestation-residence":
        return _residence_md(item["numero"], item["donnees"])
    if item["type_code"] == "extrait-naissance":
        return _naissance_md(item["numero"], item["donnees"])
    return _batir_md(item["numero"], item["donnees"])


def _add_pieces(
    session: Session,
    demande: Demande,
    filenames: list[str],
) -> None:
    """Ajoute les pièces de démonstration et leurs empreintes réelles."""

    for filename in filenames:
        path = DEMO_PIECES_DIR / filename
        if not path.is_file():
            raise FileNotFoundError(
                f"Pièce de démonstration introuvable : {path}. "
                "Exécuter scripts/generate-demo-assets.py."
            )
        content = path.read_bytes()
        session.add(
            PieceJointe(
                demande_id=demande.id or 0,
                filename=filename,
                github_path=f"demo/pieces/{filename}",
                sha256=hashlib.sha256(content).hexdigest(),
                size_bytes=len(content),
                content_type="application/pdf",
            )
        )


def _add_history(
    session: Session,
    demande: Demande,
    timeline: list[tuple[str, str | None, datetime, dict[str, Any]]],
    users: dict[str, User],
) -> None:
    """Rejoue la chronologie de la demande dans le journal d'audit."""

    for action, actor_email, created_at, details in timeline:
        actor = users.get(actor_email) if actor_email else None
        session.add(
            AuditEvent(
                demande_id=demande.id,
                actor_id=actor.id if actor else None,
                action=action,
                details=details,
                created_at=created_at,
            )
        )


def seed_all(session: Session) -> None:
    """Crée ou met à jour le jeu de démonstration, sans doublon.

    Le jeu contient quatre comptes, trois types d'actes et neuf demandes
    couvrant tous les états du workflow. Les numéros, dates et statuts sont
    fixes : une personne qui clone le projet retrouve exactement les mêmes
    tableaux de bord, files d'instruction et statistiques.
    """

    users: dict[str, User] = {}
    for item in DEMO_USERS:
        email = item["email"].lower()
        user = session.exec(select(User).where(User.email == email)).first()
        if user is None:
            user = User(
                email=email,
                password_hash=hash_password(settings.seed_password),
                first_name=item["first_name"],
                last_name=item["last_name"],
                role=item["role"],
            )
            session.add(user)
        # Un utilisateur existant n'est jamais écrasé : le seed peut tourner
        # à chaque démarrage sans annuler les modifications de l'administrateur.
        users[email] = user

    types: dict[str, TypeActe] = {}
    for item in DEMO_TYPES:
        type_acte = session.exec(
            select(TypeActe).where(TypeActe.code == item["code"])
        ).first()
        if type_acte is None:
            type_acte = TypeActe(**item)
            session.add(type_acte)
        # Même logique pour les types d'actes : seuls les manquants sont créés.
        types[item["code"]] = type_acte

    session.commit()

    demandes_by_numero: dict[str, Demande] = {}
    for item in DEMO_DEMANDES:
        numero = item["numero"]
        existing = session.exec(
            select(Demande).where(Demande.numero == numero)
        ).first()
        if existing is not None:
            demandes_by_numero[numero] = existing
            continue

        citizen = users["citoyen@gestactes.com"]
        agent = users.get(item.get("assigned_agent", ""))
        validator = users.get(item.get("assigned_validator", ""))
        type_acte = types[item["type_code"]]
        acte_md = _acte_md_for(item)
        signed_at = item.get("signed_at")
        signature = None
        if signed_at is not None and validator is not None and acte_md:
            signature = _build_signature(numero, item["donnees"], acte_md, validator, signed_at)

        timeline = item["timeline"]
        updated_at = timeline[-1][2] if timeline else item["created_at"]
        demande = Demande(
            numero=numero,
            type_acte_id=type_acte.id or 0,
            demandeur_id=citizen.id or 0,
            statut=item["statut"],
            donnees=item["donnees"],
            acte_md=acte_md,
            created_at=item["created_at"],
            updated_at=updated_at,
            assigned_agent_id=agent.id if agent else None,
            assigned_validator_id=validator.id if validator else None,
            branch_name=item.get("branch_name"),
            complement_attendu=bool(item.get("complement_attendu", False)),
            complement_message=item.get("complement_message"),
            rejection_reason=item.get("rejection_reason"),
            signed_at=signed_at,
            signed_by_id=validator.id if signed_at and validator else None,
            signature_sha256=signature["sha256_acte_json"] if signature else None,
            signature_manifest=signature,
            merge_commit_sha=_fake_sha(f"merge:{numero}") if signed_at else None,
            tag_name=f"acte-{numero}-v1" if signed_at else None,
            archived_at=item.get("archived_at"),
            last_commit_sha=_fake_sha(f"commit:{numero}"),
            idempotency_key=f"demo:{numero}",
        )
        session.add(demande)
        session.flush()

        _add_pieces(session, demande, item.get("pieces", []))
        _add_history(session, demande, timeline, users)
        demandes_by_numero[numero] = demande

    session.commit()

    for item in DEMO_NOTIFICATIONS:
        user = users[item["email"]]
        notif_demande = demandes_by_numero.get(item["numero"])
        existing_notification = session.exec(
            select(Notification).where(
                Notification.user_id == user.id,
                Notification.title == item["title"],
                Notification.demande_id == (notif_demande.id if notif_demande else None),
            )
        ).first()
        if existing_notification is None:
            session.add(
                Notification(
                    user_id=user.id or 0,
                    demande_id=notif_demande.id if notif_demande else None,
                    title=item["title"],
                    message=item["message"],
                    is_read=item["is_read"],
                    created_at=item["created_at"],
                )
            )

    session.commit()


if __name__ == "__main__":
    init_db()
    with Session(engine) as db_session:
        seed_all(db_session)
    print("Données de démonstration créées.")
