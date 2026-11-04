import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Field, IconDoc, IconSearch } from "@/components/ui";
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

  return (
    <div className="verify">
      <div className="card">
        <div className="verify__icon"><IconDoc /></div>
        <h1 style={{ textAlign: "center", fontSize: "1.4rem" }}>Vérifier l'authenticité d'un acte</h1>
        <p style={{ textAlign: "center", color: "var(--ga-muted)" }}>Aucun compte n'est nécessaire.</p>

        <div className="tabs" role="tablist" aria-label="Méthode de vérification">
          <button role="tab" aria-selected={mode === "numero"} onClick={() => { setMode("numero"); setErreur(undefined); }}>Par numéro</button>
          <button role="tab" aria-selected={mode === "qr"} onClick={() => { setMode("qr"); setErreur(undefined); }}>Par QR code</button>
        </div>

        {mode === "numero" ? (
          <form onSubmit={soumettre} noValidate>
            <Field label="Numéro de l'acte" name="numero" placeholder="ACTE-2026-00042" icon={<IconSearch />} value={valeur}
              onChange={(e) => { setValeur(e.target.value); setErreur(undefined); }} error={erreur} autoComplete="off" autoCapitalize="characters" />
            <Button type="submit" variant="teal" block>Vérifier</Button>
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
