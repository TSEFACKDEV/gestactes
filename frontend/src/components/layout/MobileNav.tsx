/**
 * Tiroir de navigation mobile.
 * Propriétaire : GUEMOGNE GERALDINE ESTHER
 * TODO : tester le responsive et la navigation clavier.
 */

import { useEffect } from "react";

import { Sidebar } from "@/components/layout/Sidebar";

export function MobileNav({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-ink/30 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
        aria-label="Fermer la navigation"
      />
      <div className="absolute inset-y-0 left-0 animate-slide-up">
        <Sidebar mobile onNavigate={onClose} />
      </div>
    </div>
  );
}
