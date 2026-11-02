/**
 * Pagination simple.
 * Propriétaire : GUEMOGNE GERALDINE ESTHER
 * TODO : ajouter un test de rendu et vérifier l'accessibilité.
 */

import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

import { Button } from "@/components/ui/Button";

export function Pagination({
  page,
  pages,
  onPageChange,
}: {
  page: number;
  pages: number;
  onPageChange: (page: number) => void;
}) {
  if (pages <= 1) return null;

  return (
    <nav
      className="flex items-center justify-between gap-4 pt-4"
      aria-label="Pagination"
    >
      <p className="text-xs text-ink-soft">
        Page <span className="font-medium text-ink">{page}</span> sur{" "}
        <span className="font-medium text-ink">{pages}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<LuChevronLeft className="h-4 w-4" aria-hidden="true" />}
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Précédent
        </Button>
        <Button
          variant="secondary"
          size="sm"
          rightIcon={<LuChevronRight className="h-4 w-4" aria-hidden="true" />}
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
        >
          Suivant
        </Button>
      </div>
    </nav>
  );
}
