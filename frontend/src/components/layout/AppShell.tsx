/**
 * Coque de l'application connectée.
 * Propriétaire : GUEMOGNE GERALDINE ESTHER
 * TODO : tester le responsive et la navigation clavier.
 */

import { useState } from "react";
import { Outlet } from "react-router-dom";

import { MobileNav } from "@/components/layout/MobileNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-canvas">
      <a href="#contenu" className="skip-link">
        Aller au contenu
      </a>
      <Sidebar />
      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="lg:pl-64">
        <Topbar onMenu={() => setMobileOpen(true)} />
        <main
          id="contenu"
          className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
