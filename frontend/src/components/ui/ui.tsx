import { Link } from "react-router-dom";
import { forwardRef, InputHTMLAttributes, ButtonHTMLAttributes, ReactNode, useState } from "react";

/* ---------- Icônes (SVG, trait 2px) ---------- */
export type IconName =
  | "mail" | "lock" | "user" | "search" | "shield" | "bolt" | "qr" | "check" | "cross" | "doc" | "grid" | "list"
  | "bell" | "menu" | "close" | "logout" | "clock" | "chevron" | "arrow-left" | "camera" | "download" | "info" | "plus" | "home" | "sun" | "moon" | "monitor" | "edit" | "key" | "arrow-up" | "mapin" | "settings";

const P: Record<IconName, ReactNode> = {
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>,
  lock: <><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>,
  shield: <><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="M9 12l2 2 4-4" /></>,
  bolt: <path d="M13 2L4 14h7l-1 8 9-12h-7z" />,
  qr: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><path d="M14 14h3v3h-3zM20 14v.01M14 20h3M20 17v4" /></>,
  check: <><circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-6" /></>,
  cross: <><circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" /></>,
  doc: <><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  list: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
  bell: <><path d="M6 8a6 6 0 0112 0c0 7 3 8 3 8H3s3-1 3-8" /><path d="M10 20a2 2 0 004 0" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  logout: <><path d="M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3" /><path d="M10 17l5-5-5-5M15 12H3" /></>,
  clock: <><circle cx="12" cy="12" r="10" /><path d="M12 7v5l3 2" /></>,
  chevron: <path d="M6 9l6 6 6-6" />,
  "arrow-left": <path d="M19 12H5M11 6l-6 6 6 6" />,
  camera: <><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></>,
  download: <path d="M12 3v12M7 11l5 5 5-5M4 20h16" />,
  info: <><circle cx="12" cy="12" r="10" /><path d="M12 11v6M12 7.5v.01" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  home: <path d="M3 11l9-8 9 8v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  moon: <path d="M21 13A9 9 0 1111 3a7 7 0 0010 10z" />,
  monitor: <><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></>,
  edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" /></>,
  key: <><circle cx="8" cy="15" r="4" /><path d="M10.8 12.2L21 2M17 6l3 3M14 9l2 2" /></>,
  "arrow-up": <path d="M12 19V5M6 11l6-6 6 6" />,
  mapin: <><path d="M12 22s7-6 7-12a7 7 0 10-14 0c0 6 7 12 7 12z" /><circle cx="12" cy="10" r="2.5" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" /></>,
};

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {P[name]}
    </svg>
  );
}

/* ---------- Logo simple HTML/CSS ---------- */
export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <span
      className="logo__mark"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.34) }}
      aria-hidden="true"
    >
      GA
    </span>
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
  return <span className="spinner" role="status" aria-label="Chargement" style={dark ? { color: "var(--ga-navy)", borderColor: "rgba(18,59,93,.2)", borderTopColor: "var(--ga-navy)", width: "1.6rem", height: "1.6rem" } : undefined} />;
}

/* ---------- Champ de formulaire ---------- */
interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: ReactNode;
}
export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field({ label, error, icon, type = "text", id, className, ...rest }, ref) {
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
          className={`${isPassword ? "has-toggle " : ""}${className ?? ""}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-err` : undefined}
          style={!icon ? { paddingLeft: ".95rem" } : undefined}
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

/* Raccourcis conservés pour les pages existantes */
export const IconMail = () => <Icon name="mail" />;
export const IconLock = () => <Icon name="lock" />;
export const IconUser = () => <Icon name="user" />;
export const IconSearch = () => <Icon name="search" />;
export const IconShield = () => <Icon name="shield" />;
export const IconBolt = () => <Icon name="bolt" />;
export const IconCheck = ({ size = 32 }: { size?: number }) => <Icon name="check" size={size} />;
export const IconCross = ({ size = 32 }: { size?: number }) => <Icon name="cross" size={size} />;
export const IconDoc = () => <Icon name="doc" size={32} />;

export function BackLink({ to, children }: { to: string; children: ReactNode }) {
  return <Link className="backlink" to={to}><Icon name="arrow-left" size={18} />{children}</Link>;
}
