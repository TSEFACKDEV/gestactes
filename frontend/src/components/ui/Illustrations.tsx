/** Bâtiment administratif avec drapeau (couleurs du Cameroun) – hero de la page d'accueil. */
export function Facade() {
  return (
    <svg viewBox="0 0 440 330" role="img" aria-label="Bâtiment administratif surmonté d'un drapeau">
      {/* drapeau */}
      <rect x="219" y="6" width="3" height="76" fill="#cfe0ec" />
      <g transform="translate(222 8)">
        <rect width="22" height="44" fill="#007a5e" /><rect x="22" width="22" height="44" fill="#ce1126" /><rect x="44" width="22" height="44" fill="#fcd116" />
        <path d="M33 14l2.6 7.6h8l-6.4 4.7 2.4 7.7-6.6-4.7-6.6 4.7 2.4-7.7-6.4-4.7h8z" fill="#fcd116" />
      </g>
      {/* fronton */}
      <path d="M40 130h360L220 62z" fill="#eaf2f8" />
      <path d="M220 62l180 68H220z" fill="#cfe0ec" />
      <circle cx="220" cy="106" r="15" fill="#168c83" stroke="#fff" strokeWidth="3" />
      {/* entablement */}
      <rect x="56" y="136" width="328" height="18" rx="2" fill="#fff" />
      {/* colonnes */}
      {[78, 132, 186, 240, 294, 348].map((x) => (
        <g key={x}><rect x={x - 3} y="158" width="32" height="10" fill="#fff" /><rect x={x} y="168" width="26" height="102" fill="#eaf2f8" /><rect x={x + 13} y="168" width="13" height="102" fill="#cfe0ec" /><rect x={x - 3} y="268" width="32" height="10" fill="#fff" /></g>
      ))}
      {/* porte */}
      <rect x="196" y="206" width="48" height="72" rx="5" fill="#123b5d" /><rect x="219" y="206" width="2" height="72" fill="#168c83" />
      {/* marches */}
      <rect x="40" y="278" width="360" height="12" fill="#fff" /><rect x="24" y="290" width="392" height="14" fill="#eaf2f8" /><rect x="8" y="304" width="424" height="16" rx="3" fill="#d9a441" />
    </svg>
  );
}

/** Vague dorée / turquoise du panneau d'authentification (clin d'œil à la maquette). */
export function Wave() {
  return (
    <svg className="auth__wave" viewBox="0 0 600 160" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 90C120 40 240 140 380 90S560 40 600 70V160H0z" fill="#168c83" opacity=".85" />
      <path d="M0 120C140 80 260 160 400 118S560 90 600 112V160H0z" fill="#0c2b45" opacity=".55" />
      <path d="M0 92C120 42 240 142 380 92S560 42 600 72" fill="none" stroke="#d9a441" strokeWidth="5" />
    </svg>
  );
}
