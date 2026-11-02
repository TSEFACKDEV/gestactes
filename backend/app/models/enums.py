"""Énumérations métier partagées.

Propriétaire : TSEFACK CALVIN KLEIN (contrat gelé).
Les valeurs sont la source de vérité pour la base, l'API et le front-end.


TODO : maintenir le socle et ajouter les tests de non-régression.
"""

from enum import StrEnum


class Role(StrEnum):
    CITOYEN = "citoyen"
    AGENT = "agent"
    VALIDATEUR = "validateur"
    ADMIN = "admin"


class StatutDemande(StrEnum):
    DEMANDEE = "demandee"
    EN_INSTRUCTION = "en_instruction"
    EN_VALIDATION = "en_validation"
    VALIDEE = "validee"
    SIGNEE = "signee"
    ARCHIVEE = "archivee"
    REJETEE = "rejetee"
    ANNULEE = "annulee"


class OutboxStatus(StrEnum):
    PENDING = "pending"
    PROCESSING = "processing"
    DONE = "done"
    FAILED = "failed"


class JobType(StrEnum):
    GITHUB_PROVISION_DEMANDE = "github.provision_demande"
    GITHUB_COMMIT_ACTE = "github.commit_acte"
    GITHUB_OPEN_PR = "github.open_pr"
    GITHUB_MERGE_PR = "github.merge_pr"
    GITHUB_ARCHIVE = "github.archive"
    EMAIL_SEND = "email.send"
    PDF_GENERATE = "pdf.generate"
    NOTIFICATION_CREATE = "notification.create"
