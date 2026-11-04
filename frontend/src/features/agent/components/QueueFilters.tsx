/**
 * Filtres de la file agent.
 * Propriétaire : LEUKAM TCHEUMALEU MAXIME
 * TODO : tester les transitions et les conflits 409.
 */

import { LuSearch } from "react-icons/lu";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

const OPTIONS = [
  { value: "", label: "Tous les statuts" },
  { value: "demandee", label: "À prendre en charge" },
  { value: "en_instruction", label: "En instruction" },
  { value: "en_validation", label: "En validation" },
];

export function QueueFilters({
  q,
  onQChange,
  statut,
  onStatutChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
}: {
  q: string;
  onQChange: (value: string) => void;
  statut: string;
  onStatutChange: (value: string) => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Input
            aria-label="Rechercher une demande"
            placeholder="Rechercher par numéro ou demandeur"
            value={q}
            onChange={(event) => onQChange(event.target.value)}
            leftIcon={<LuSearch className="h-4 w-4" aria-hidden="true" />}
          />
        </div>
        <div className="sm:w-56">
          <Select
            aria-label="Filtrer par statut"
            options={OPTIONS}
            value={statut}
            onChange={(event) => onStatutChange(event.target.value)}
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          type="date"
          label="Depuis le"
          value={dateFrom}
          onChange={(event) => onDateFromChange(event.target.value)}
        />
        <Input
          type="date"
          label="Jusqu'au"
          value={dateTo}
          onChange={(event) => onDateToChange(event.target.value)}
        />
      </div>
    </div>
  );
}
