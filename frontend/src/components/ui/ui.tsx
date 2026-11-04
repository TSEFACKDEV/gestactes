import { forwardRef, InputHTMLAttributes, ButtonHTMLAttributes, ReactNode, useState } from "react";

/* ---------- Logo ---------- */
export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <path d="M10 30c0 14 8 24 22 28C46 54 54 44 54 30" fill="none" stroke="#D9A441" strokeWidth="3" strokeLinecap="round" />
      <path d="M32 8l18 6v15c0 12-8 20-18 24C22 49 14 41 14 29V14z" fill="#168C83" stroke="#fff" strokeWidth="2.5" />
      <path d="M32 8l18 6v15c0 12-8 20-18 24z" fill="#123B5D" opacity=".35" />
      <path d="M24 30l6 6 11-13" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ light = false, size = 36 }: { light?: boolean; size?: number }) {
  return (
    <span className={`logo${light ? " logo--light" : ""}`}>
      <LogoMark size={size} />
      <span>Gest<b>Actes</b></span>
    </span>
  );
}

/* ---------- Bouton ---------- */
type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "gold" | "navy" | "teal" | "ghost";
  block?: boolean;
  loading?: boolean;
};
export function Button({ variant = "gold", block, loading, children, disabled, className = "", ...rest }: BtnProps) {
  return (
    <button className={`btn btn--${variant}${block ? " btn--block" : ""} ${className}`} disabled={disabled || loading} {...rest}>
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export function Spinner({ dark = false }: { dark?: boolean }) {
  return <span className="spinner" role="status" aria-label="Chargement" style={dark ? { color: "var(--ga-navy)", borderColor: "rgba(18,59,93,.2)", borderTopColor: "var(--ga-navy)" } : undefined} />;
}

/* ---------- Champ de formulaire ---------- */
interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: ReactNode;
}
export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field({ label, error, icon, type = "text", id, ...rest }, ref) {
  const [visible, setVisible] = useState(false);
  const inputId = id ?? `f-${rest.name}`;
  const isPassword = type === "password";
  return (
    <div className={`field${error ? " field--error" : ""}`}>
      <label htmlFor={inputId}>{label}</label>
      <div className="field__control">
        {icon && <span className="field__icon" aria-hidden="true">{icon}</span>}
        <input
          ref={ref}
          id={inputId}
          type={isPassword && visible ? "text" : type}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-err` : undefined}
          style={!icon ? { paddingLeft: ".9rem" } : undefined}
          {...rest}
        />
        {isPassword && (
          <button type="button" className="field__toggle" onClick={() => setVisible((v) => !v)} aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}>
            {visible ? "Masquer" : "Afficher"}
          </button>
        )}
      </div>
      {error && <div id={`${inputId}-err`} className="field__error" role="alert">{error}</div>}
    </div>
  );
});

export function Alert({ kind, children }: { kind: "error" | "success" | "info"; children: ReactNode }) {
  return <div className={`alert alert--${kind}`} role={kind === "error" ? "alert" : "status"}>{children}</div>;
}

/* ---------- Icônes minimalistes (SVG) ---------- */
const base = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
export const IconMail = () => <svg {...base}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>;
export const IconLock = () => <svg {...base}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></svg>;
export const IconUser = () => <svg {...base}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>;
export const IconSearch = () => <svg {...base}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>;
export const IconShield = () => <svg {...base}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="M9 12l2 2 4-4" /></svg>;
export const IconBolt = () => <svg {...base}><path d="M13 2L4 14h7l-1 8 9-12h-7z" /></svg>;
export const IconQr = () => <svg {...base}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><path d="M14 14h3v3h-3zM20 14v.01M14 20h3M20 17v4" /></svg>;
export const IconCheck = ({ size = 32 }: { size?: number }) => <svg {...base} width={size} height={size} strokeWidth={2.5}><circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-6" /></svg>;
export const IconCross = ({ size = 32 }: { size?: number }) => <svg {...base} width={size} height={size} strokeWidth={2.5}><circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" /></svg>;
export const IconDoc = () => <svg {...base} width={30} height={30}><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></svg>;
