import { Icon } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";

export function ThemeToggle() {
  const { resolved, toggle } = useTheme();
  const versSombre = resolved === "light";
  return (
    <button type="button" className="theme-toggle" onClick={toggle} aria-label={versSombre ? "Activer le thème sombre" : "Activer le thème clair"} title={versSombre ? "Thème sombre" : "Thème clair"}>
      <Icon name={versSombre ? "moon" : "sun"} size={20} />
    </button>
  );
}
