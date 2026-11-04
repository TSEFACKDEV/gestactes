"""Génération du PDF et du QR code officiel avec ReportLab.

Propriétaire : NOLACK KAWUNJIBI FRANGE PARKER
"""

import io
import qrcode
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as RLImage
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

from app.core.config import settings
from app.schemas.acte import ActeContent, SignatureManifest


def verification_url(numero: str) -> str:
    """URL publique encodée dans le QR code."""
    return f"{settings.frontend_url}/verification/{numero}"


def generate_qr_code_bytes(url: str) -> bytes:
    """Génère l'image PNG d'un QR code en mémoire (bytes)."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf.read()


def generate_pdf(
    acte: ActeContent,
    acte_md: str,
    signature: SignatureManifest,
) -> bytes:
    """Génère le PDF officiel de l'acte administratif avec ReportLab et QR code."""
    buffer = io.BytesIO()
    
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=54,
        leftMargin=54,
        topMargin=54,
        bottomMargin=54,
    )
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=18,
        leading=22,
        spaceAfter=12,
    )
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontSize=11,
        leading=16,
        spaceAfter=10,
    )
    
    story = []
    
    # En-tête officiel
    story.append(Paragraph("<b>REPUBLIQUE DU CAMEROUN</b>", body_style))
    story.append(Paragraph("Gestion Sécurisée des Actes Administratifs (GestActes)", body_style))
    story.append(Spacer(1, 15))
    
    # Titre et Numéro
    story.append(Paragraph(f"<b>ACTE ADMINISTRATIF : {acte.numero}</b>", title_style))
    story.append(Paragraph(f"<b>Type :</b> {acte.type}", body_style))
    story.append(Spacer(1, 10))
    
    # Contenu Markdown / Description
    story.append(Paragraph("<b>Contenu de l'acte :</b>", body_style))
    for line in acte_md.split("\n"):
        if line.strip():
            story.append(Paragraph(line.strip(), body_style))
            
    story.append(Spacer(1, 15))
    
    # Bloc de signature
    story.append(Paragraph("<b>Informations de Signature :</b>", body_style))
    if signature and signature.signataires:
        for sig in signature.signataires:
            story.append(Paragraph(f"- Signataire ID : {sig.user_id} (Rôle : {sig.role})", body_style))
    story.append(Paragraph(f"<b>Hash SHA-256 Acte :</b> <code>{signature.sha256_acte_json if signature else 'N/A'}</code>", body_style))
    
    story.append(Spacer(1, 20))
    
    # Génération et insertion du QR Code de vérification
    url_verif = verification_url(acte.numero)
    qr_bytes = generate_qr_code_bytes(url_verif)
    qr_img = RLImage(io.BytesIO(qr_bytes), width=90, height=90)
    story.append(qr_img)
    story.append(Paragraph(f"<font size=8>Vérifiez cet acte en scannant ce QR code ou via : {url_verif}</font>", body_style))
    
    doc.build(story)
    
    pdf_data = buffer.getvalue()
    buffer.close()
    
    # S'assure que le résultat commence bien par %PDF
    if not pdf_data.startswith(b"%PDF"):
        raise ValueError("Le document généré n'est pas un PDF valide.")
        
    return pdf_data