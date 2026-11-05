import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BackLink, Button, Field, Icon } from "@/components/ui";
import { QrScanner } from "@/components/QrScanner";
import { extraireNumeroDepuisQr, normaliserNumero, numeroValide } from "@/lib/validation";

export default function VerifyPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"numero" | "qr">("numero");
  const [valeur, setValeur] = useState("");
  const [erreur, setErreur] = useState<string>();

  const aller = (numero: string) => navigate(`/verifier/${encodeURIComponent(numero)}`);
  const soumettre = (e: FormEvent) => {
    e.preventDefault();
    if (!numeroValide(valeur)) return setErreur("Format attendu : ACTE-2026-00042.");
    aller(normaliserNumero(valeur));
  };
  const surQr = (texte: string) => {
    const n = extraireNumeroDepuisQr(texte);
    if (n) aller(n); else setErreur("Ce QR code n'est pas un acte GestActes.");
  };
  const changer = (m: "numero" | "qr") => { setMode(m); setErreur(undefined); };

  return (
    <div className="page-narrow">
      <BackLink to="/">Retour à l'accueil</BackLink>
      <div className="card" style={{ marginTop: ".5rem" }}>
        <div className="verify__icon"><Icon name="doc" size={32} /></div>
        <h1 style={{ textAlign: "center", fontSize: "1.45rem" }}>Vérifier l'authenticité d'un acte</h1>
        <p style={{ textAlign: "center", color: "var(--ga-muted)" }}>Aucun compte n'est nécessaire.</p>

        <div className="tabs" role="tablist" aria-label="Méthode de vérification">
          <button role="tab" aria-selected={mode === "numero"} onClick={() => changer("numero")}><Icon name="search" size={18} />Par numéro</button>
          <button role="tab" aria-selected={mode === "qr"} onClick={() => changer("qr")}><Icon name="qr" size={18} />Par QR code</button>
        </div>

        {mode === "numero" ? (
          <form onSubmit={soumettre} noValidate>
            <Field label="Numéro de l'acte" name="numero" placeholder="ACTE-2026-00042" icon={<Icon name="doc" />} value={valeur}
              onChange={(e) => { setValeur(e.target.value); setErreur(undefined); }} error={erreur} autoComplete="off" autoCapitalize="characters" />
            <Button type="submit" variant="teal" block>Vérifier</Button>
            <div className="chips" style={{ justifyContent: "center" }}>Exemple <button type="button" className="chip" onClick={() => { setValeur("ACTE-2026-00042"); setErreur(undefined); }}>ACTE-2026-00042</button></div>
          </form>
        ) : (
          <>
            <QrScanner onDecode={surQr} />
            {erreur && <div className="field__error" role="alert" style={{ marginTop: ".5rem" }}>{erreur}</div>}
          </>
        )}
      </div>
    </div>
  );
}
