import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface Props { onDecode: (texte: string) => void }

/** Scanne un QR code avec la caméra (chargement à la demande pour alléger le bundle). */
export function QrScanner({ onDecode }: Props) {
  const [actif, setActif] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const scanner = useRef<Html5Qrcode | null>(null);
  const cb = useRef(onDecode);
  cb.current = onDecode;

  useEffect(() => {
    if (!actif) return;
    const s = new Html5Qrcode("qr-reader");
    scanner.current = s;
    s.start({ facingMode: "environment" }, { fps: 10, qrbox: 220 }, (txt) => { cb.current(txt); }, () => undefined)
      .catch(() => { setErreur("Caméra inaccessible. Autorisez l'accès à la caméra ou saisissez le numéro."); setActif(false); });
    return () => {
      if (s.isScanning) {
        void s.stop().then(() => s.clear()).catch(() => undefined);
      }
    };
  }, [actif]);

  return (
    <div className="qr-box">
      {actif ? <div id="qr-reader" /> : (
        <>
          <p style={{ margin: "0 0 .75rem", color: "var(--ga-navy)", fontWeight: 600 }}>Scannez le QR code de l'acte</p>
          <button type="button" className="btn btn--teal" onClick={() => { setErreur(null); setActif(true); }}>Activer la caméra</button>
        </>
      )}
      {actif && <button type="button" className="btn btn--ghost" style={{ marginTop: ".75rem" }} onClick={() => setActif(false)}>Arrêter</button>}
      {erreur && <div className="field__error" role="alert" style={{ marginTop: ".75rem" }}>{erreur}</div>}
    </div>
  );
}
