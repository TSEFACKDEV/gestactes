/**
 * Tableau.
 * Propriétaire : GUEMOGNE GERALDINE ESTHER
 * TODO : ajouter un test de rendu et vérifier l'accessibilité.
 */

import type { HTMLAttributes, ReactNode, ThHTMLAttributes, TdHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Table({
  children,
  caption,
  className,
}: {
  children: ReactNode;
  caption?: string;
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto rounded-xl border border-line bg-surface shadow-soft", className)}>
      <table className="min-w-full text-left text-sm">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-surface-muted/70 text-xs uppercase tracking-wide text-ink-soft">
      {children}
    </thead>
  );
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-line">{children}</tbody>;
}

export function TR({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn("transition hover:bg-surface-muted/40", className)}
      {...props}
    />
  );
}

export function TH({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn("px-4 py-3 font-medium", className)} {...props} />;
}

export function TD({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-3 align-middle", className)} {...props} />;
}
