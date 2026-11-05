#!/usr/bin/env python3
"""Génère les pièces et PDF de démonstration de GestActes.

Les fichiers produits sont versionnés dans `backend/app/seed_data/` afin que
le jeu de données soit identique après un clone, sans dépendre de GitHub.
"""

from __future__ import annotations

import io
import textwrap
from datetime import UTC, datetime
from pathlib import Path

import qrcode
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parent.parent
SEED_DATA = ROOT / "backend" / "app" / "seed_data"
PIECES_DIR = SEED_DATA / "pieces"
PDF_DIR = SEED_DATA / "pdf"

GREEN = (0.118, 0.302, 0.227)
GOLD = (0.753, 0.541, 0.180)
INK = (0.141, 0.200, 0.165)
GRAY = (0.392, 0.459, 0.416)
CREAM = (0.969, 0.957, 0.925)


def _header(pdf: canvas.Canvas, title: str, subtitle: str) -> float:
    width, height = A4
    pdf.setFillColorRGB(*GREEN)
    pdf.rect(0, height - 54, width, 54, fill=1, stroke=0)
    pdf.setFillColorRGB(0.753, 0.541, 0.180)
    pdf.setFont("Helvetica-Bold", 17)
    pdf.drawString(42, height - 35, "GA")
    pdf.setFillColorRGB(1, 1, 1)
    pdf.drawString(78, height - 35, "GESTACTES")
    pdf.setFont("Helvetica", 8)
    pdf.drawRightString(width - 42, height - 31, "République du Cameroun — Commune de Douala 5e")

    y = height - 92
    pdf.setFillColorRGB(*INK)
    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawString(42, y, title)
    y -= 18
    pdf.setFillColorRGB(*GRAY)
    pdf.setFont("Helvetica", 9)
    pdf.drawString(42, y, subtitle)
    pdf.setStrokeColorRGB(*GOLD)
    pdf.setLineWidth(1.2)
    pdf.line(42, y - 9, width - 42, y - 9)
    return y - 32


def _wrap(pdf: canvas.Canvas, text: str, x: float, y: float, width: int = 92) -> float:
    pdf.setFont("Helvetica", 10)
    pdf.setFillColorRGB(*INK)
    for line in textwrap.wrap(text, width=width):
        pdf.drawString(x, y, line)
        y -= 15
    return y


def _footer(pdf: canvas.Canvas, mention: str = "Donnée fictive — GestActes") -> None:
    width, _ = A4
    pdf.setFillColorRGB(*CREAM)
    pdf.rect(0, 0, width, 34, fill=1, stroke=0)
    pdf.setFillColorRGB(*GRAY)
    pdf.setFont("Helvetica-Oblique", 7.5)
    pdf.drawString(42, 13, mention)
    pdf.drawRightString(width - 42, 13, "Document de démonstration — sans valeur légale")


def write_piece(filename: str, title: str, lines: list[str]) -> None:
    path = PIECES_DIR / filename
    pdf = canvas.Canvas(str(path), pagesize=A4)
    pdf.setTitle(title)
    pdf.setAuthor("GestActes")
    pdf.setSubject("Pièce justificative de démonstration")
    y = _header(pdf, title, "Pièce justificative jointe à un dossier de démonstration")

    pdf.setFillColorRGB(*CREAM)
    pdf.roundRect(42, y - 120, A4[0] - 84, 112, 8, fill=1, stroke=0)
    y -= 18
    for line in lines:
        y = _wrap(pdf, line, 58, y)
        y -= 4

    pdf.setFillColorRGB(*GRAY)
    pdf.setFont("Helvetica", 8)
    pdf.drawString(42, 62, f"Fichier : {filename}")
    _footer(pdf)
    pdf.save()


def write_acte(
    filename: str,
    title: str,
    numero: str,
    lines: list[str],
    signer: str,
    signed_at: str,
) -> None:
    path = PDF_DIR / filename
    pdf = canvas.Canvas(str(path), pagesize=A4)
    pdf.setTitle(f"{title} — {numero}")
    pdf.setAuthor("GestActes")
    pdf.setSubject("Acte administratif de démonstration")
    y = _header(pdf, title, f"Acte n° {numero} — Commune de Douala 5e")

    pdf.setFillColorRGB(*CREAM)
    pdf.roundRect(42, y - 190, A4[0] - 84, 182, 8, fill=1, stroke=0)
    y -= 20
    for line in lines:
        y = _wrap(pdf, line, 58, y)
        y -= 4

    y -= 16
    pdf.setFillColorRGB(*GREEN)
    pdf.setFont("Helvetica-Bold", 10)
    pdf.drawString(42, y, "Signature")
    pdf.setFillColorRGB(*INK)
    pdf.setFont("Helvetica", 9)
    pdf.drawString(42, y - 16, f"Signé par : {signer}")
    pdf.drawString(42, y - 30, f"Date : {signed_at}")
    pdf.drawString(42, y - 44, "Algorithme : SHA-256 — Version 1")

    qr_value = f"http://localhost:8080/verifier/{numero}"
    qr = qrcode.make(qr_value)
    buffer = io.BytesIO()
    qr.save(buffer, format="PNG")
    buffer.seek(0)
    pdf.drawImage(
        ImageReader(buffer),
        A4[0] - 142,
        y - 76,
        width=92,
        height=92,
        preserveAspectRatio=True,
        mask="auto",
    )
    pdf.setFillColorRGB(*GRAY)
    pdf.setFont("Helvetica", 7)
    pdf.drawString(A4[0] - 142, y - 86, "Scanner pour vérifier")
    pdf.drawString(42, y - 62, f"Vérification publique : {qr_value}")

    _footer(pdf)
    pdf.save()


def main() -> None:
    PIECES_DIR.mkdir(parents=True, exist_ok=True)
    PDF_DIR.mkdir(parents=True, exist_ok=True)

    pieces = {
        "AR-2026-000101_justificatif-domicile.pdf": (
            "Justificatif de domicile",
            [
                "Titulaire : Awa Ndiaye",
                "Adresse : Rue des Palmiers, immeuble Akwa, Bonamoussadi, Douala 5e.",
                "Document : facture d'électricité de démonstration.",
                "Date de la pièce : 12 octobre 2026.",
            ],
        ),
        "EN-2026-000102_ancien-acte-naissance.pdf": (
            "Ancien extrait d'acte de naissance",
            [
                "Titulaire : Awa Ndiaye",
                "Née le 14 juin 1998 à Douala.",
                "Acte n° 1234/1998 — centre d'état civil de Douala 5e.",
                "Reproduction fournie à titre de pièce justificative.",
            ],
        ),
        "AB-2026-000103_plan-de-masse.pdf": (
            "Plan de masse",
            [
                "Pétitionnaire : Awa Ndiaye",
                "Parcelle : Rue des Écoles, Bonamoussadi, Douala 5e.",
                "Surface : 500 m² — construction d'une maison R+1.",
                "Document de démonstration établi pour le dossier AB-2026-000103.",
            ],
        ),
        "AB-2026-000103_titre-foncier.pdf": (
            "Titre foncier",
            [
                "Référence : TF-1234/DLA.",
                "Propriétaire : Awa Ndiaye.",
                "Localisation : Bonamoussadi, commune de Douala 5e.",
                "Copie de démonstration — aucune valeur juridique.",
            ],
        ),
        "AR-2026-000104_justificatif-domicile.pdf": (
            "Justificatif de domicile",
            [
                "Titulaire : Awa Ndiaye",
                "Adresse : Rue du Marché, Makepe, Douala 5e.",
                "Document : attestation de bail de démonstration.",
                "Date de la pièce : 3 octobre 2026.",
            ],
        ),
        "EN-2026-000105_cni.pdf": (
            "Carte nationale d'identité",
            [
                "Titulaire : Awa Ndiaye",
                "Née le 14 juin 1998 à Douala.",
                "Numéro de démonstration : 123456789.",
                "Copie fictive utilisée pour le jeu de données GestActes.",
            ],
        ),
        "AB-2026-000106_plan-de-masse.pdf": (
            "Plan de masse",
            [
                "Pétitionnaire : Awa Ndiaye",
                "Parcelle : Rue de la Paix, Makepe, Douala 5e.",
                "Surface : 350 m² — extension d'une maison d'habitation.",
                "Document de démonstration établi pour le dossier AB-2026-000106.",
            ],
        ),
        "AR-2026-000107_justificatif-domicile.pdf": (
            "Justificatif de domicile",
            [
                "Titulaire : Awa Ndiaye",
                "Adresse : Rue Njo-Njo, Bonapriso, Douala 5e.",
                "Document de démonstration volontairement peu lisible.",
                "Sert à illustrer un rejet pour pièce insuffisante.",
            ],
        ),
        "AB-2026-000109_plan-de-masse.pdf": (
            "Plan de masse",
            [
                "Pétitionnaire : Awa Ndiaye",
                "Parcelle : Rue des Palmiers, Bonamoussadi, Douala 5e.",
                "Surface : 220 m² — garage et clôture.",
                "Plan de situation à compléter par le géomètre.",
            ],
        ),
    }
    for filename, (title, lines) in pieces.items():
        write_piece(filename, title, lines)

    acts = {
        "acte-EN-2026-000105.pdf": (
            "Extrait d'acte de naissance",
            "EN-2026-000105",
            [
                "Awa Ndiaye, née le 14 juin 1998 à Douala, sexe féminin.",
                "Acte n° 5678/1998 — centre d'état civil de la Mairie de Douala 5e.",
                "Père : Ndiaye Paul. Mère : Mbarga Jeanne.",
                "Le présent extrait est délivré pour servir et valoir ce que de droit.",
            ],
            "Eunice Nzeutem, validateur",
            "9 octobre 2026 à 14 h 40",
        ),
        "acte-AB-2026-000106.pdf": (
            "Autorisation de bâtir",
            "AB-2026-000106",
            [
                "Autorisation délivrée à Awa Ndiaye pour l'extension d'une maison d'habitation.",
                "Parcelle située rue de la Paix, quartier Makepe, Douala 5e.",
                "Surface du terrain : 350 m². Titre foncier : TF-5678/DLA.",
                "Début des travaux : 15 octobre 2026. Validité : 6 mois.",
            ],
            "Eunice Nzeutem, validateur",
            "25 septembre 2026 à 16 h 20",
        ),
    }
    for filename, (title, numero, lines, signer, signed_at) in acts.items():
        write_acte(filename, title, numero, lines, signer, signed_at)

    (SEED_DATA / "README.md").write_text(
        "# Données de démonstration\n\n"
        "Ce dossier contient les pièces justificatives et les PDF d'actes\n"
        "utilisés par `app/seed.py`. Les fichiers sont générés par\n"
        "`scripts/generate-demo-assets.py` et versionnés pour que chaque clone\n"
        "du projet retrouve les mêmes documents, sans dépendre de GitHub.\n\n"
        "Aucune donnée personnelle réelle n'est utilisée.\n",
        encoding="utf-8",
    )
    print(f"Pièces générées : {len(pieces)}")
    print(f"Actes PDF générés : {len(acts)}")
    print(f"Dossier : {SEED_DATA}")


if __name__ == "__main__":
    main()
